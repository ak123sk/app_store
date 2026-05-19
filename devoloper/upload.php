<?php
/**
 * APK Upload & Processing System
 * Features: File validation, APK parsing, metadata extraction, auto-organization
 */

session_start();
header('Content-Type: application/json');

// Security headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

// Configuration
define('MAX_UPLOAD_SIZE', 100 * 1024 * 1024); // 100MB
define('ALLOWED_EXTENSIONS', ['apk']);
define('UPLOAD_DIR', __DIR__ . '/apk/file/');
define('LOGO_DIR', __DIR__ . '/apk/logo/');
define('SCREENSHOTS_DIR', __DIR__ . '/apk/screenshots/');
define('TEMP_DIR', __DIR__ . '/temp/');

// Response class
class APIResponse {
    public static function success($data, $message = 'Success') {
        echo json_encode([
            'status' => 'success',
            'message' => $message,
            'data' => $data,
            'timestamp' => time()
        ]);
        exit;
    }
    
    public static function error($message, $code = 400) {
        http_response_code($code);
        echo json_encode([
            'status' => 'error',
            'message' => $message,
            'code' => $code,
            'timestamp' => time()
        ]);
        exit;
    }
}

// Security validations
class SecurityValidator {
    public static function validateCSRF($token) {
        if (!isset($_SESSION['csrf_token']) || $token !== $_SESSION['csrf_token']) {
            APIResponse::error('Invalid CSRF token', 403);
        }
    }
    
    public static function sanitizeFileName($filename) {
        // Remove path traversal attempts
        $filename = basename($filename);
        // Remove special characters
        $filename = preg_replace('/[^a-zA-Z0-9._-]/', '', $filename);
        // Ensure .apk extension
        if (!preg_match('/\.apk$/i', $filename)) {
            $filename .= '.apk';
        }
        return $filename;
    }
    
    public static function validateFileType($file) {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);
        
        $allowedMimes = [
            'application/vnd.android.package-archive',
            'application/octet-stream',
            'application/x-zip-compressed'
        ];
        
        if (!in_array($mimeType, $allowedMimes)) {
            return false;
        }
        
        // Additional check - APK signature
        $zip = new ZipArchive();
        if ($zip->open($file['tmp_name']) === TRUE) {
            $hasManifest = $zip->locateName('AndroidManifest.xml') !== false;
            $zip->close();
            return $hasManifest;
        }
        
        return false;
    }
}

// APK Parser
class APKParser {
    private $apkPath;
    private $aaptPath;
    
    public function __construct($apkPath) {
        $this->apkPath = $apkPath;
        $this->aaptPath = $this->findAAPT();
    }
    
    private function findAAPT() {
        // Check common locations for aapt
        $possiblePaths = [
            '/usr/bin/aapt',
            '/usr/local/bin/aapt',
            '/usr/lib/android-sdk/build-tools/*/aapt',
            'aapt' // System PATH
        ];
        
        foreach ($possiblePaths as $path) {
            if (function_exists('shell_exec')) {
                $result = shell_exec("which $path 2>/dev/null");
                if ($result) return trim($result);
            }
        }
        
        return null;
    }
    
    public function extractMetadata() {
        $metadata = [
            'package_name' => '',
            'version_name' => '',
            'version_code' => '',
            'app_name' => '',
            'min_sdk' => '',
            'target_sdk' => '',
            'permissions' => [],
            'size' => filesize($this->apkPath),
            'hash' => [
                'md5' => md5_file($this->apkPath),
                'sha1' => sha1_file($this->apkPath),
                'sha256' => hash_file('sha256', $this->apkPath)
            ]
        ];
        
        if ($this->aaptPath) {
            $metadata = array_merge($metadata, $this->parseWithAAPT());
        }
        
        // Fallback: Parse binary XML from APK
        $metadata = array_merge($metadata, $this->parseBinaryXML());
        
        return $metadata;
    }
    
    private function parseWithAAPT() {
        $data = [];
        
        // Get basic info
        $output = shell_exec("{$this->aaptPath} dump badging {$this->apkPath} 2>/dev/null");
        
        if ($output) {
            // Parse package info
            preg_match("/package: name='([^']+)' versionCode='([^']+)' versionName='([^']+)'/i", $output, $packageMatches);
            if (isset($packageMatches[1])) $data['package_name'] = $packageMatches[1];
            if (isset($packageMatches[2])) $data['version_code'] = $packageMatches[2];
            if (isset($packageMatches[3])) $data['version_name'] = $packageMatches[3];
            
            // Parse app name
            preg_match("/application: label='([^']+)'/i", $output, $appMatches);
            if (isset($appMatches[1])) $data['app_name'] = $appMatches[1];
            
            // Parse SDK versions
            preg_match("/sdkVersion:'([^']+)'/i", $output, $sdkMatches);
            if (isset($sdkMatches[1])) $data['min_sdk'] = $sdkMatches[1];
            
            preg_match("/targetSdkVersion:'([^']+)'/i", $output, $targetSdkMatches);
            if (isset($targetSdkMatches[1])) $data['target_sdk'] = $targetSdkMatches[1];
            
            // Parse permissions
            preg_match_all("/uses-permission:'([^']+)'/i", $output, $permissionMatches);
            if (isset($permissionMatches[1])) {
                $data['permissions'] = $permissionMatches[1];
            }
        }
        
        return $data;
    }
    
    private function parseBinaryXML() {
        $data = [
            'package_name' => '',
            'version_name' => 'Unknown',
            'version_code' => '0'
        ];
        
        $zip = new ZipArchive();
        if ($zip->open($this->apkPath) === TRUE) {
            // Try to extract and parse AndroidManifest.xml
            $manifest = $zip->getFromName('AndroidManifest.xml');
            
            // Parse resources.arsc for app name
            $resources = $zip->getFromName('resources.arsc');
            
            // Basic binary parsing (simplified)
            if ($manifest) {
                // Extract package name from binary XML
                $data['package_name'] = $this->extractPackageFromBinaryXML($manifest);
            }
            
            $zip->close();
        }
        
        return $data;
    }
    
    private function extractPackageFromBinaryXML($binaryData) {
        // Simplified package name extraction
        // In production, use proper AXML parser library
        if (preg_match('/[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+/', $binaryData, $matches)) {
            return $matches[0];
        }
        return '';
    }
    
    public function extractIcon() {
        $zip = new ZipArchive();
        if ($zip->open($this->apkPath) !== TRUE) {
            return false;
        }
        
        // Find the highest resolution icon
        $possibleIcons = [
            'res/mipmap-xxxhdpi-v4/ic_launcher.png',
            'res/mipmap-xxhdpi-v4/ic_launcher.png',
            'res/mipmap-xhdpi-v4/ic_launcher.png',
            'res/mipmap-hdpi-v4/ic_launcher.png',
            'res/mipmap-mdpi-v4/ic_launcher.png',
            'res/drawable-xxxhdpi/ic_launcher.png',
            'res/drawable/ic_launcher.png',
            'icon.png'
        ];
        
        foreach ($possibleIcons as $iconPath) {
            $iconData = $zip->getFromName($iconPath);
            if ($iconData !== false) {
                $zip->close();
                return $iconData;
            }
        }
        
        $zip->close();
        return false;
    }
}

// Main Upload Handler
class UploadHandler {
    private $file;
    private $metadata;
    
    public function __construct($file) {
        $this->file = $file;
    }
    
    public function process() {
        // Validate file
        $this->validate();
        
        // Move uploaded file
        $filename = SecurityValidator::sanitizeFileName($this->file['name']);
        $destination = UPLOAD_DIR . $filename;
        
        if (!move_uploaded_file($this->file['tmp_name'], $destination)) {
            APIResponse::error('Failed to move uploaded file');
        }
        
        // Parse APK
        $parser = new APKParser($destination);
        $this->metadata = $parser->extractMetadata();
        
        // Extract icon
        $iconData = $parser->extractIcon();
        $logoPath = '';
        if ($iconData) {
            $packageName = $this->metadata['package_name'];
            $logoFilename = $packageName . '.png';
            file_put_contents(LOGO_DIR . $logoFilename, $iconData);
            $logoPath = $logoFilename;
        }
        
        return [
            'filename' => $filename,
            'filesize' => $this->metadata['size'],
            'metadata' => $this->metadata,
            'logo' => $logoPath,
            'upload_time' => time()
        ];
    }
    
    private function validate() {
        // Check for errors
        if ($this->file['error'] !== UPLOAD_ERR_OK) {
            $errorMessages = [
                UPLOAD_ERR_INI_SIZE => 'File exceeds upload_max_filesize',
                UPLOAD_ERR_FORM_SIZE => 'File exceeds MAX_FILE_SIZE',
                UPLOAD_ERR_PARTIAL => 'File was only partially uploaded',
                UPLOAD_ERR_NO_FILE => 'No file was uploaded',
                UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder',
                UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
                UPLOAD_ERR_EXTENSION => 'File upload stopped by extension'
            ];
            
            $message = $errorMessages[$this->file['error']] ?? 'Unknown upload error';
            APIResponse::error($message);
        }
        
        // Check file size
        if ($this->file['size'] > MAX_UPLOAD_SIZE) {
            APIResponse::error('File exceeds maximum size limit of ' . (MAX_UPLOAD_SIZE / 1024 / 1024) . 'MB');
        }
        
        // Validate file type
        if (!SecurityValidator::validateFileType($this->file)) {
            APIResponse::error('Invalid file type. Only APK files are allowed.');
        }
    }
}

// Handle file upload
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Validate CSRF
    SecurityValidator::validateCSRF($_POST['csrf_token'] ?? '');
    
    if (!isset($_FILES['apk_file'])) {
        APIResponse::error('No file uploaded');
    }
    
    $handler = new UploadHandler($_FILES['apk_file']);
    $result = $handler->process();
    
    // Store metadata in session for next step
    $_SESSION['uploaded_apk'] = $result;
    
    APIResponse::success($result, 'APK uploaded and processed successfully');
}

// Generate CSRF token for GET request
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    APIResponse::success(['csrf_token' => $_SESSION['csrf_token']]);
}
?>

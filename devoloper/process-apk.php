<?php
/**
 * APK Data Collection & Processing
 * Takes extracted metadata and user-provided information
 */

session_start();
header('Content-Type: application/json');

class APKDataManager {
    private $dataDir;
    
    public function __construct() {
        $this->dataDir = __DIR__ . '/apk/';
    }
    
    public function saveCompleteData($apkData, $userData) {
        // Combine automatic and manual data
        $completeData = $this->mergeData($apkData, $userData);
        
        // Validate all required fields
        $this->validateCompleteData($completeData);
        
        // Save to JSON files
        $this->updateAPKInfo($completeData);
        $this->initializeExperience($completeData);
        
        return $completeData;
    }
    
    private function mergeData($apkData, $userData) {
        return [
            'id' => $this->generateAppID(),
            'package_name' => $apkData['metadata']['package_name'],
            'name' => $userData['app_name'] ?? $apkData['metadata']['app_name'],
            'version' => $apkData['metadata']['version_name'],
            'version_code' => $apkData['metadata']['version_code'],
            'description' => $userData['description'] ?? '',
            'short_description' => $userData['short_description'] ?? '',
            'category' => $userData['category'] ?? 'uncategorized',
            'subcategory' => $userData['subcategory'] ?? '',
            'developer' => [
                'name' => $userData['developer_name'] ?? '',
                'email' => $userData['developer_email'] ?? '',
                'website' => $userData['developer_website'] ?? '',
                'privacy_policy' => $userData['privacy_policy_url'] ?? ''
            ],
            'size' => $apkData['metadata']['size'],
            'installs' => '0',
            'rating' => 0,
            'rating_count' => 0,
            'content_rating' => $userData['content_rating'] ?? 'Everyone',
            'requires_os' => $userData['min_android_version'] ?? $apkData['metadata']['min_sdk'],
            'updated_date' => date('Y-m-d'),
            'released_date' => date('Y-m-d'),
            'is_featured' => false,
            'is_trending' => false,
            'is_free' => $userData['is_free'] ?? true,
            'price' => $userData['price'] ?? 0,
            'currency' => 'USD',
            'permissions' => $this->formatPermissions(
                $apkData['metadata']['permissions'] ?? [],
                $userData['permission_reasons'] ?? []
            ),
            'screenshots' => $userData['screenshots'] ?? [],
            'logo' => $apkData['logo'] ?? '',
            'apk_file' => $apkData['filename'],
            'apk_hash' => $apkData['metadata']['hash'],
            'min_sdk' => $apkData['metadata']['min_sdk'],
            'target_sdk' => $apkData['metadata']['target_sdk'],
            'features' => $userData['features'] ?? [],
            'languages' => $userData['languages'] ?? ['en'],
            'in_app_purchases' => $userData['has_in_app_purchases'] ?? false,
            'status' => 'pending',
            'upload_date' => date('Y-m-d H:i:s'),
            'last_modified' => date('Y-m-d H:i:s')
        ];
    }
    
    private function formatPermissions($permissions, $reasons) {
        $formatted = [];
        
        $permissionLabels = [
            'android.permission.INTERNET' => 'Internet Access',
            'android.permission.CAMERA' => 'Camera',
            'android.permission.ACCESS_FINE_LOCATION' => 'Precise Location',
            'android.permission.ACCESS_COARSE_LOCATION' => 'Approximate Location',
            'android.permission.READ_CONTACTS' => 'Read Contacts',
            'android.permission.WRITE_CONTACTS' => 'Write Contacts',
            'android.permission.READ_EXTERNAL_STORAGE' => 'Read Storage',
            'android.permission.WRITE_EXTERNAL_STORAGE' => 'Write Storage',
            'android.permission.RECORD_AUDIO' => 'Record Audio',
            'android.permission.READ_PHONE_STATE' => 'Read Phone State',
            'android.permission.CALL_PHONE' => 'Make Calls',
            'android.permission.READ_SMS' => 'Read SMS',
            'android.permission.SEND_SMS' => 'Send SMS',
            'android.permission.RECEIVE_SMS' => 'Receive SMS',
            'android.permission.VIBRATE' => 'Vibrate',
            'android.permission.WAKE_LOCK' => 'Prevent Sleeping'
        ];
        
        foreach ($permissions as $permission) {
            $formatted[] = [
                'name' => $permission,
                'label' => $permissionLabels[$permission] ?? $permission,
                'reason' => $reasons[$permission] ?? 'Required for app functionality'
            ];
        }
        
        return $formatted;
    }
    
    private function updateAPKInfo($data) {
        $infoFile = $this->dataDir . 'apk_info.json';
        $existingData = [];
        
        if (file_exists($infoFile)) {
            $existingData = json_decode(file_get_contents($infoFile), true) ?? [];
        }
        
        // Check if app already exists
        $found = false;
        foreach ($existingData['apps'] ?? [] as $key => $app) {
            if ($app['package_name'] === $data['package_name']) {
                $existingData['apps'][$key] = array_merge($app, $data);
                $found = true;
                break;
            }
        }
        
        if (!$found) {
            $existingData['apps'][] = $data;
        }
        
        // Update metadata
        $existingData['metadata'] = [
            'version' => '1.0',
            'last_updated' => date('Y-m-d H:i:s'),
            'total_apps' => count($existingData['apps'])
        ];
        
        // Save with pretty print
        file_put_contents(
            $infoFile,
            json_encode($existingData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
        );
    }
    
    private function initializeExperience($data) {
        $expFile = $this->dataDir . 'apk_exp.json';
        $existingData = [];
        
        if (file_exists($expFile)) {
            $existingData = json_decode(file_get_contents($expFile), true) ?? [];
        }
        
        $experienceData = [
            'package_name' => $data['package_name'],
            'downloads' => 0,
            'weekly_downloads' => 0,
            'daily_active_users' => 0,
            'total_reviews' => 0,
            'average_session_time' => 0,
            'ratings_distribution' => [
                '1_star' => 0,
                '2_star' => 0,
                '3_star' => 0,
                '4_star' => 0,
                '5_star' => 0
            ],
            'reviews' => [],
            'changelog' => [
                [
                    'version' => $data['version'],
                    'date' => date('Y-m-d'),
                    'changes' => ['Initial release']
                ]
            ]
        ];
        
        // Check if exists
        $found = false;
        foreach ($existingData['apps'] ?? [] as $key => $app) {
            if ($app['package_name'] === $data['package_name']) {
                $found = true;
                break;
            }
        }
        
        if (!$found) {
            $existingData['apps'][] = $experienceData;
        }
        
        $existingData['metadata'] = [
            'version' => '1.0',
            'last_updated' => date('Y-m-d H:i:s')
        ];
        
        file_put_contents(
            $expFile,
            json_encode($existingData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
        );
    }
    
    private function validateCompleteData($data) {
        $required = [
            'name' => 'App name is required',
            'package_name' => 'Package name is required',
            'description' => 'Description is required',
            'category' => 'Category is required',
            'developer' => 'Developer information is required',
            'apk_file' => 'APK file is required'
        ];
        
        foreach ($required as $field => $message) {
            if (empty($data[$field])) {
                throw new Exception($message);
            }
        }
    }
    
    private function generateAppID() {
        return 'app_' . uniqid() . '_' . bin2hex(random_bytes(4));
    }
}

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($_SESSION['uploaded_apk'])) {
            http_response_code(400);
            echo json_encode(['error' => 'No APK data found. Please upload APK first.']);
            exit;
        }
        
        $manager = new APKDataManager();
        $completeData = $manager->saveCompleteData(
            $_SESSION['uploaded_apk'],
            $input
        );
        
        // Clear session data
        unset($_SESSION['uploaded_apk']);
        
        echo json_encode([
            'success' => true,
            'message' => 'App data saved successfully',
            'data' => $completeData
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
?>

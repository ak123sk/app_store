<?php
/**
 * Security Configuration
 */

// Error reporting (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/logs/error.log');

// Security headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Permissions-Policy: geolocation=(), microphone=(), camera=()');

// Session security
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 1);
ini_set('session.cookie_samesite', 'Strict');
ini_set('session.use_strict_mode', 1);

// Database configuration (if needed)
define('DB_HOST', 'localhost');
define('DB_NAME', 'app_store');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');

// API rate limiting
define('RATE_LIMIT', 100); // requests per hour
define('RATE_LIMIT_WINDOW', 3600); // 1 hour

// File upload settings
define('MAX_UPLOAD_SIZE', 100 * 1024 * 1024); // 100MB
define('ALLOWED_FILE_TYPES', ['apk', 'png', 'jpg', 'jpeg', 'webp']);

// Paths
define('ROOT_PATH', __DIR__);
define('UPLOAD_PATH', ROOT_PATH . '/apk/file/');
define('LOGO_PATH', ROOT_PATH . '/apk/logo/');
define('SCREENSHOTS_PATH', ROOT_PATH . '/apk/screenshots/');

// Create necessary directories
$directories = [
    ROOT_PATH . '/logs',
    UPLOAD_PATH,
    LOGO_PATH,
    SCREENSHOTS_PATH,
    ROOT_PATH . '/temp'
];

foreach ($directories as $dir) {
    if (!file_exists($dir)) {
        mkdir($dir, 0755, true);
    }
}

// Function to validate API key
function validateAPIKey($key) {
    $validKeys = [
        'your-secret-api-key-here'
    ];
    return in_array($key, $validKeys);
}

// Function to log security events
function logSecurityEvent($event, $data = []) {
    $logFile = ROOT_PATH . '/logs/security.log';
    $timestamp = date('Y-m-d H:i:s');
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
    
    $logEntry = sprintf(
        "[%s] IP: %s | Event: %s | Data: %s | UA: %s\n",
        $timestamp,
        $ip,
        $event,
        json_encode($data),
        $userAgent
    );
    
    file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
}

// Function to sanitize input
function sanitizeInput($data) {
    if (is_array($data)) {
        return array_map('sanitizeInput', $data);
    }
    return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
}

// CSRF Protection
function generateCSRFToken() {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function validateCSRFToken($token) {
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}
?>

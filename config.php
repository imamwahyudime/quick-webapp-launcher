<?php
// config.php

// --- DATABASE CONFIGURATION ---
define('DB_HOST', 'localhost'); // Or your database host (e.g., 127.0.0.1)
define('DB_NAME', 'database');   // The database name you created
define('DB_USER', 'username');   // Your MySQL username
define('DB_PASS', ''); // Your MySQL password
define('DB_CHARSET', 'utf8mb4');

// --- SESSION MANAGEMENT ---
// Start the session if it's not already started.
// This is crucial for login and user verification.
if (session_status() == PHP_SESSION_NONE) {
    // Set session cookie parameters for better security (optional but recommended)
    // session_set_cookie_params([
    //     'lifetime' => 0, // Session cookie lasts until browser is closed
    //     'path' => '/',
    //     'domain' => '', // Your domain
    //     'secure' => isset($_SERVER['HTTPS']), // Send only over HTTPS
    //     'httponly' => true, // Prevent JavaScript access to session cookie
    //     'samesite' => 'Lax' // Or 'Strict'
    // ]);
    session_start();
}

// --- ERROR REPORTING (for development) ---
// Turn on error reporting for debugging during development.
// You should turn this off or log errors to a file in a production environment.
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// --- SITE CONFIGURATION (Optional) ---
// define('BASE_URL', 'http://localhost/your-project-folder/'); // Adjust if needed

// --- DATABASE CONNECTION FUNCTION ---
/**
 * Establishes a PDO database connection.
 * @return PDO|null Returns a PDO connection object on success, or null on failure.
 */
function getDBConnection() {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // Throw exceptions on errors
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // Fetch associative arrays
        PDO::ATTR_EMULATE_PREPARES   => false,                  // Use native prepared statements
    ];

    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        return $pdo;
    } catch (PDOException $e) {
        // In a real application, you might log this error and show a generic message.
        // For now, we'll output the error for debugging.
        // Do not use this in production directly as it can expose sensitive info.
        error_log("Database Connection Error: " . $e->getMessage());
        // For a user-facing message, you might do:
        // die("Could not connect to the database. Please try again later.");
        die("Database Connection Error: " . $e->getMessage()); // Simple die for now
        return null; // Should not reach here if die() is used
    }
}

/**
 * Checks if a user is logged in.
 * @return bool True if user is logged in, false otherwise.
 */
function isLoggedIn() {
    return isset($_SESSION['user_id']);
}

/**
 * Requires login for a page. Redirects to login page if not logged in.
 * Optionally checks if the user is an admin.
 * @param bool $requireAdmin If true, also checks if the logged-in user is an admin.
 */
function requireLogin($requireAdmin = false) {
    if (!isLoggedIn()) {
        // If you have a login page, redirect there.
        // For an API, you might return a 401 Unauthorized error.
        // For now, let's assume API context will handle it.
        // header('Location: login.php'); // Example for web pages
        // For API, this check will be done before processing actions
        return false; // Indicate not logged in
    }
    if ($requireAdmin && (!isset($_SESSION['is_admin']) || !$_SESSION['is_admin'])) {
        // User is logged in but not an admin
        return false; // Indicate not authorized as admin
    }
    return true; // Logged in and, if required, is an admin
}

?>
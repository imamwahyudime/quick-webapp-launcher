<?php
// auth_api.php

// Include the configuration file for database connection and session management
require_once 'config.php';

// Set the content type to application/json for all responses from this API
header('Content-Type: application/json');

// Determine the action requested by the client
// We'll use a GET parameter 'action' for this
$action = $_GET['action'] ?? '';

// --- Main Logic ---
try {
    $pdo = getDBConnection(); // Establish database connection

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // For actions that modify state, like login
        $input = json_decode(file_get_contents('php://input'), true);

        if ($action === 'login') {
            handleLogin($pdo, $input);
        } elseif ($action === 'logout') {
            handleLogout();
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid action for POST request.']);
            http_response_code(400); // Bad Request
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // For actions that retrieve state, like checking login status
        if ($action === 'status') {
            handleStatus();
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid action for GET request.']);
            http_response_code(400); // Bad Request
        }
    } else {
        // Method not allowed
        echo json_encode(['success' => false, 'message' => 'HTTP method not supported.']);
        http_response_code(405); // Method Not Allowed
    }

} catch (PDOException $e) {
    // Catch database connection errors specifically if getDBConnection throws
    error_log("Auth API Database Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Database error. Please try again later.']);
    http_response_code(500); // Internal Server Error
} catch (Exception $e) {
    error_log("Auth API General Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'An unexpected error occurred.']);
    http_response_code(500); // Internal Server Error
}


// --- ACTION HANDLERS ---

/**
 * Handles user login.
 * Expects 'username' and 'password' in the input array.
 */
function handleLogin($pdo, $input) {
    if (empty($input['username']) || empty($input['password'])) {
        echo json_encode(['success' => false, 'message' => 'Username and password are required.']);
        http_response_code(400); // Bad Request
        return;
    }

    $username = trim($input['username']);
    $password = $input['password'];

    $stmt = $pdo->prepare("SELECT id, username, password_hash, is_admin FROM users WHERE username = :username");
    $stmt->bindParam(':username', $username);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && password_verify($password, $user['password_hash'])) {
        // Password is correct, set up the session
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['is_admin'] = (bool) $user['is_admin']; // Store admin status

        echo json_encode([
            'success' => true,
            'message' => 'Login successful.',
            'user' => [
                'username' => $user['username'],
                'isAdmin' => $_SESSION['is_admin']
            ]
        ]);
    } else {
        // Invalid credentials
        echo json_encode(['success' => false, 'message' => 'Invalid username or password.']);
        http_response_code(401); // Unauthorized
    }
}

/**
 * Handles user logout.
 */
function handleLogout() {
    // Unset all session variables
    $_SESSION = array();

    // If it's desired to kill the session, also delete the session cookie.
    // Note: This will destroy the session, and not just the session data!
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }

    // Finally, destroy the session.
    session_destroy();

    echo json_encode(['success' => true, 'message' => 'Logout successful.']);
}

/**
 * Handles checking the current login status.
 */
function handleStatus() {
    if (isLoggedIn()) {
        echo json_encode([
            'success' => true,
            'loggedIn' => true,
            'user' => [
                'username' => $_SESSION['username'],
                'isAdmin' => $_SESSION['is_admin'] ?? false // Ensure isAdmin is always present
            ]
        ]);
    } else {
        echo json_encode(['success' => true, 'loggedIn' => false]);
    }
}

?>
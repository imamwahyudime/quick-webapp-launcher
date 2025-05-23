<?php
// programs_api.php (Revised for Public View / Admin Edit)

require_once 'config.php'; // Includes session_start() and db connection
header('Content-Type: application/json');

// Get the current logged-in user's ID and admin status, if logged in
$loggedInUserId = $_SESSION['user_id'] ?? null;
$isAdmin = (isset($_SESSION['is_admin']) && $_SESSION['is_admin'] === true);

// Determine the action and HTTP method
$action = $_GET['action'] ?? null;
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

try {
    $pdo = getDBConnection();

    // Publicly accessible actions
    if ($method === 'GET' && $action === 'fetch') {
        handleFetchPrograms($pdo);
    } elseif ($method === 'GET' && $action === 'export') {
        handleExportPrograms($pdo);
    }
    // Admin-only actions
    elseif ($action === 'add' && $method === 'POST') {
        if (!$isAdmin) throw new Exception("Administrator privileges required.", 403);
        handleAddProgram($pdo, $loggedInUserId, $input); // Pass admin's ID
    } elseif ($action === 'update' && $method === 'POST') { // Could also be PUT
        if (!$isAdmin) throw new Exception("Administrator privileges required.", 403);
        $programId = $_GET['id'] ?? null;
        if (!$programId) throw new Exception("Program ID is required for update.", 400);
        handleUpdateProgram($pdo, $loggedInUserId, $programId, $input); // Pass admin's ID
    } elseif ($action === 'delete' && $method === 'POST') { // Could also be DELETE
        if (!$isAdmin) throw new Exception("Administrator privileges required.", 403);
        $programId = $_GET['id'] ?? null;
        if (!$programId) throw new Exception("Program ID is required for delete.", 400);
        handleDeleteProgram($pdo, $programId);
    } elseif ($action === 'reorder' && $method === 'POST') {
        if (!$isAdmin) throw new Exception("Administrator privileges required.", 403);
        handleReorderPrograms($pdo, $input);
    } elseif ($action === 'import' && $method === 'POST') {
        if (!$isAdmin) throw new Exception("Administrator privileges required.", 403);
        handleImportPrograms($pdo, $loggedInUserId, $input); // Pass admin's ID
    }
    else {
        // If no public or admin action matched, check if user tried an admin action without being logged in as admin
        $adminActions = ['add', 'update', 'delete', 'reorder', 'import'];
        if (in_array($action, $adminActions) && !$isAdmin) {
             if (!$loggedInUserId) { // Not logged in at all
                 throw new Exception("Authentication required. Please log in as an administrator.", 401);
             } else { // Logged in but not admin
                 throw new Exception("Administrator privileges required.", 403);
             }
        }
        throw new Exception("Invalid action or method.", 400);
    }

} catch (PDOException $e) {
    error_log("Programs API Database Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error occurred.']);
} catch (Exception $e) {
    error_log("Programs API General Error: " . $e->getMessage() . " (Code: " . $e->getCode() . ")");
    $errorCode = is_int($e->getCode()) && $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
    http_response_code($errorCode);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

// --- ACTION HANDLERS ---

// Public: Fetches all programs for the global list
function handleFetchPrograms($pdo) {
    // user_id in SELECT is mostly for audit/info if needed by an admin view later
    $stmt = $pdo->query("SELECT id, name, description, launch_command, icon_type, user_id FROM programs ORDER BY display_order ASC, created_at ASC");
    $programs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'programs' => $programs]);
}

// Admin: Adds a program to the global list
function handleAddProgram($pdo, $adminUserId, $data) {
    if (empty($data['name']) || empty($data['launchCommand'])) {
        throw new Exception("Program name and launch command (URL) are required.", 400);
    }
    $id = $data['id'] ?? 'prog_' . time() . '_' . bin2hex(random_bytes(4));

    $stmtOrder = $pdo->query("SELECT MAX(display_order) AS max_order FROM programs");
    $maxOrderResult = $stmtOrder->fetch(PDO::FETCH_ASSOC);
    $nextOrder = ($maxOrderResult && $maxOrderResult['max_order'] !== null) ? (int)$maxOrderResult['max_order'] + 1 : 0;

    $stmt = $pdo->prepare("INSERT INTO programs (id, user_id, name, description, launch_command, icon_type, display_order) VALUES (:id, :user_id, :name, :description, :launch_command, :icon_type, :display_order)");
    $params = [
        ':id' => $id,
        ':user_id' => $adminUserId, // Admin's ID
        ':name' => trim($data['name']),
        ':description' => trim($data['description'] ?? ''),
        ':launch_command' => trim($data['launchCommand']),
        ':icon_type' => $data['iconType'] ?? 'default',
        ':display_order' => $nextOrder
    ];
    $stmt->execute($params);

    $newProgram = $params; // Contains all data
    unset($newProgram[':user_id']); // Don't need to send admin's ID back in this field explicitly
    $newProgram['user_id'] = $adminUserId; // add it normally

    http_response_code(201);
    echo json_encode(['success' => true, 'message' => 'Program added successfully.', 'program' => $newProgram]);
}

// Admin: Updates a program in the global list
function handleUpdateProgram($pdo, $adminUserId, $programId, $data) {
    if (empty($data['name']) || empty($data['launchCommand'])) {
        throw new Exception("Program name and launch command (URL) are required.", 400);
    }

    // Update the program, and set the user_id to the current admin performing the edit
    $stmt = $pdo->prepare("UPDATE programs SET name = :name, description = :description, launch_command = :launch_command, icon_type = :icon_type, user_id = :user_id WHERE id = :id");
    $params = [
        ':id' => $programId,
        ':user_id' => $adminUserId, // Current admin's ID
        ':name' => trim($data['name']),
        ':description' => trim($data['description'] ?? ''),
        ':launch_command' => trim($data['launchCommand']),
        ':icon_type' => $data['iconType'] ?? 'default'
    ];
    $stmt->execute($params);

    if ($stmt->rowCount() > 0) {
        $updatedProgram = $params; // contains all new data
        echo json_encode(['success' => true, 'message' => 'Program updated successfully.', 'program' => $updatedProgram]);
    } else {
        $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM programs WHERE id = :id");
        $checkStmt->execute([':id' => $programId]);
        if ($checkStmt->fetchColumn() == 0) {
            throw new Exception("Program not found.", 404);
        }
        echo json_encode(['success' => true, 'message' => 'No changes detected or program already up to date.', 'program' => $data]);
    }
}

// Admin: Deletes a program from the global list
function handleDeleteProgram($pdo, $programId) {
    $stmt = $pdo->prepare("DELETE FROM programs WHERE id = :id");
    $stmt->bindParam(':id', $programId);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'Program deleted successfully.']);
    } else {
        throw new Exception("Program not found.", 404);
    }
}

// Admin: Reorders programs in the global list
function handleReorderPrograms($pdo, $data) {
    if (!isset($data['orderedIds']) || !is_array($data['orderedIds'])) {
        throw new Exception("Invalid data format for reordering. Expected 'orderedIds' array.", 400);
    }
    $orderedIds = $data['orderedIds'];
    $pdo->beginTransaction();
    try {
        // No user_id check here as it's a global list being reordered by an admin
        $stmt = $pdo->prepare("UPDATE programs SET display_order = :display_order WHERE id = :id");
        foreach ($orderedIds as $index => $programId) {
            $stmt->execute([':display_order' => $index, ':id' => $programId]);
        }
        $pdo->commit();
        echo json_encode(['success' => true, 'message' => 'Program order updated successfully.']);
    } catch (Exception $e) {
        $pdo->rollBack();
        throw new Exception("Failed to reorder programs: " . $e->getMessage(), 500);
    }
}

// Admin: Imports programs, replacing the global list
function handleImportPrograms($pdo, $adminUserId, $data) {
    if (!isset($data['programs']) || !is_array($data['programs'])) {
        throw new Exception("Invalid data format for import. Expected 'programs' array.", 400);
    }
    $importedPrograms = $data['programs'];

    $pdo->beginTransaction();
    try {
        // Clear existing global programs before import
        $pdo->query("DELETE FROM programs");

        $stmt = $pdo->prepare(
            "INSERT INTO programs (id, user_id, name, description, launch_command, icon_type, display_order)
             VALUES (:id, :user_id, :name, :description, :launch_command, :icon_type, :display_order)"
            // No ON DUPLICATE KEY UPDATE needed if we are clearing first
        );

        $importedCount = 0;
        foreach ($importedPrograms as $index => $program) {
            if (empty($program['id']) || empty($program['name']) || !isset($program['description']) || empty($program['launchCommand']) || empty($program['iconType'])) {
                // Skip invalid items or throw error - for now, let's be strict
                throw new Exception("Invalid program item format during import. All fields (id, name, description, launchCommand, iconType) are required for each item.", 400);
            }
            $params = [
                ':id' => $program['id'],
                ':user_id' => $adminUserId, // Assign to current admin
                ':name' => trim($program['name']),
                ':description' => trim($program['description']),
                ':launch_command' => trim($program['launchCommand']),
                ':icon_type' => $program['iconType'],
                ':display_order' => $program['display_order'] ?? $index
            ];
            $stmt->execute($params);
            $importedCount++;
        }

        $pdo->commit();
        if ($importedCount === 0 && !empty($importedPrograms)) {
             echo json_encode(['success' => true, 'message' => 'Import completed, but no valid program data found to import.', 'importedProgramsCount' => 0]);
        } else {
             echo json_encode(['success' => true, 'message' => 'Programs imported successfully, replacing the previous list.', 'importedProgramsCount' => $importedCount]);
        }
    } catch (Exception $e) {
        $pdo->rollBack();
        throw new Exception("Failed to import programs: " . $e->getMessage(), 500);
    }
}

// Public: Exports all programs from the global list
function handleExportPrograms($pdo) {
    $stmt = $pdo->query("SELECT id, name, description, launch_command, icon_type, display_order FROM programs ORDER BY display_order ASC");
    $programs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    // We don't include user_id in public exports usually
    echo json_encode($programs);
}

?>
<?php
// programs_api.php

require_once 'config.php'; // Includes session_start() and db connection
header('Content-Type: application/json');

// All actions in this API require a logged-in user.
if (!isLoggedIn()) {
    http_response_code(401); // Unauthorized
    echo json_encode(['success' => false, 'message' => 'Authentication required. Please log in.']);
    exit;
}

$userId = $_SESSION['user_id']; // Get the current logged-in user's ID

// Determine the action and HTTP method
$action = $_GET['action'] ?? null;
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

try {
    $pdo = getDBConnection();

    if ($method === 'GET' && $action === 'fetch') {
        handleFetchPrograms($pdo, $userId);
    } elseif ($method === 'POST' && $action === 'add') {
        handleAddProgram($pdo, $userId, $input);
    } elseif ($method === 'POST' && $action === 'update') { // Could also be PUT
        $programId = $_GET['id'] ?? null;
        if (!$programId) {
            throw new Exception("Program ID is required for update.", 400);
        }
        handleUpdateProgram($pdo, $userId, $programId, $input);
    } elseif ($method === 'POST' && $action === 'delete') { // Could also be DELETE
        $programId = $_GET['id'] ?? null;
        if (!$programId) {
            throw new Exception("Program ID is required for delete.", 400);
        }
        handleDeleteProgram($pdo, $userId, $programId);
    } elseif ($method === 'POST' && $action === 'reorder') {
        handleReorderPrograms($pdo, $userId, $input);
    } elseif ($method === 'POST' && $action === 'import') {
        handleImportPrograms($pdo, $userId, $input);
    }
    // Export is a GET request as it doesn't change server state
    elseif ($method === 'GET' && $action === 'export') {
        handleExportPrograms($pdo, $userId);
    }
     else {
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

function handleFetchPrograms($pdo, $userId) {
    $stmt = $pdo->prepare("SELECT id, name, description, launch_command, icon_type FROM programs WHERE user_id = :user_id ORDER BY display_order ASC, created_at ASC");
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    $programs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'programs' => $programs]);
}

function handleAddProgram($pdo, $userId, $data) {
    if (empty($data['name']) || empty($data['launchCommand'])) { // Description can be empty
        throw new Exception("Program name and launch command (URL) are required.", 400);
    }
    // Generate ID similar to frontend logic or ensure frontend sends it
    $id = $data['id'] ?? 'prog_' . time() . '_' . bin2hex(random_bytes(4));


    // Get the current max display_order for this user
    $stmtOrder = $pdo->prepare("SELECT MAX(display_order) AS max_order FROM programs WHERE user_id = :user_id");
    $stmtOrder->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmtOrder->execute();
    $maxOrderResult = $stmtOrder->fetch(PDO::FETCH_ASSOC);
    $nextOrder = ($maxOrderResult && $maxOrderResult['max_order'] !== null) ? (int)$maxOrderResult['max_order'] + 1 : 0;

    $stmt = $pdo->prepare("INSERT INTO programs (id, user_id, name, description, launch_command, icon_type, display_order) VALUES (:id, :user_id, :name, :description, :launch_command, :icon_type, :display_order)");
    $params = [
        ':id' => $id,
        ':user_id' => $userId,
        ':name' => trim($data['name']),
        ':description' => trim($data['description'] ?? ''),
        ':launch_command' => trim($data['launchCommand']),
        ':icon_type' => $data['iconType'] ?? 'default',
        ':display_order' => $nextOrder
    ];
    $stmt->execute($params);

    // Return the newly added program including its generated ID and display_order
    $newProgram = [
        'id' => $id, // The ID used for insertion
        'name' => $params[':name'],
        'description' => $params[':description'],
        'launchCommand' => $params[':launch_command'],
        'iconType' => $params[':icon_type'],
        'display_order' => $params[':display_order']
    ];
    http_response_code(201); // Created
    echo json_encode(['success' => true, 'message' => 'Program added successfully.', 'program' => $newProgram]);
}

function handleUpdateProgram($pdo, $userId, $programId, $data) {
    if (empty($data['name']) || empty($data['launchCommand'])) {
        throw new Exception("Program name and launch command (URL) are required.", 400);
    }

    $stmt = $pdo->prepare("UPDATE programs SET name = :name, description = :description, launch_command = :launch_command, icon_type = :icon_type WHERE id = :id AND user_id = :user_id");
    $params = [
        ':id' => $programId,
        ':user_id' => $userId,
        ':name' => trim($data['name']),
        ':description' => trim($data['description'] ?? ''),
        ':launch_command' => trim($data['launchCommand']),
        ':icon_type' => $data['iconType'] ?? 'default'
    ];
    $stmt->execute($params);

    if ($stmt->rowCount() > 0) {
        $updatedProgram = [
            'id' => $programId,
            'name' => $params[':name'],
            'description' => $params[':description'],
            'launchCommand' => $params[':launch_command'],
            'iconType' => $params[':icon_type']
            // display_order is not changed here, handled by reorder
        ];
        echo json_encode(['success' => true, 'message' => 'Program updated successfully.', 'program' => $updatedProgram]);
    } else {
        // Either program not found for this user or no changes were made
        // Check if program exists for this user
        $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM programs WHERE id = :id AND user_id = :user_id");
        $checkStmt->execute([':id' => $programId, ':user_id' => $userId]);
        if ($checkStmt->fetchColumn() == 0) {
            throw new Exception("Program not found or you don't have permission to update it.", 404);
        }
        // If it exists but rowCount is 0, no actual data changed.
        echo json_encode(['success' => true, 'message' => 'No changes detected or program already up to date.', 'program' => $data]);
    }
}

function handleDeleteProgram($pdo, $userId, $programId) {
    $stmt = $pdo->prepare("DELETE FROM programs WHERE id = :id AND user_id = :user_id");
    $stmt->bindParam(':id', $programId);
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'Program deleted successfully.']);
    } else {
        throw new Exception("Program not found or you don't have permission to delete it.", 404);
    }
}

function handleReorderPrograms($pdo, $userId, $data) {
    // $data is expected to be an array of program IDs in the new order.
    // e.g., { "orderedIds": ["prog_1", "prog_2", "prog_3"] }
    if (!isset($data['orderedIds']) || !is_array($data['orderedIds'])) {
        throw new Exception("Invalid data format for reordering. Expected 'orderedIds' array.", 400);
    }

    $orderedIds = $data['orderedIds'];
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare("UPDATE programs SET display_order = :display_order WHERE id = :id AND user_id = :user_id");
        foreach ($orderedIds as $index => $programId) {
            $stmt->execute([
                ':display_order' => $index,
                ':id' => $programId,
                ':user_id' => $userId
            ]);
        }
        $pdo->commit();
        echo json_encode(['success' => true, 'message' => 'Program order updated successfully.']);
    } catch (Exception $e) {
        $pdo->rollBack();
        throw new Exception("Failed to reorder programs: " . $e->getMessage(), 500);
    }
}

function handleImportPrograms($pdo, $userId, $data) {
    // $data is expected to be an array of program objects to import
    // e.g., { "programs": [ { "id": "...", "name": "...", ...} ] }
    if (!isset($data['programs']) || !is_array($data['programs'])) {
        throw new Exception("Invalid data format for import. Expected 'programs' array.", 400);
    }

    $importedPrograms = $data['programs'];
    if (empty($importedPrograms)) {
         echo json_encode(['success' => true, 'message' => 'No programs to import.']);
         return;
    }

    $pdo->beginTransaction();
    try {
        // Optional: Clear existing programs for this user before import
        // $deleteStmt = $pdo->prepare("DELETE FROM programs WHERE user_id = :user_id");
        // $deleteStmt->execute([':user_id' => $userId]);
        // Make sure to confirm this with the user on the frontend if you implement clearing.
        // For now, we'll assume the frontend handles the confirmation for "replace"

        $stmt = $pdo->prepare(
            "INSERT INTO programs (id, user_id, name, description, launch_command, icon_type, display_order)
             VALUES (:id, :user_id, :name, :description, :launch_command, :icon_type, :display_order)
             ON DUPLICATE KEY UPDATE
                name = VALUES(name),
                description = VALUES(description),
                launch_command = VALUES(launch_command),
                icon_type = VALUES(icon_type),
                display_order = VALUES(display_order),
                user_id = VALUES(user_id)" // Ensure user_id doesn't get changed if item belonged to another user
        );

        $newlyAddedPrograms = [];
        foreach ($importedPrograms as $index => $program) {
            // Basic validation for each program item
            if (empty($program['id']) || empty($program['name']) || !isset($program['description']) || empty($program['launchCommand']) || empty($program['iconType'])) {
                throw new Exception("Invalid program item format during import. All fields are required.", 400);
            }

            $params = [
                ':id' => $program['id'],
                ':user_id' => $userId, // Assign to current user
                ':name' => trim($program['name']),
                ':description' => trim($program['description']),
                ':launch_command' => trim($program['launchCommand']),
                ':icon_type' => $program['iconType'],
                ':display_order' => $program['display_order'] ?? $index // Use provided order or fall back to array index
            ];
            $stmt->execute($params);
            $newlyAddedPrograms[] = $params; // Or fetch from DB if needed, but this is simpler
        }

        $pdo->commit();
        echo json_encode(['success' => true, 'message' => 'Programs imported successfully.', 'importedProgramsCount' => count($newlyAddedPrograms)]);
    } catch (Exception $e) {
        $pdo->rollBack();
        throw new Exception("Failed to import programs: " . $e->getMessage(), 500);
    }
}

function handleExportPrograms($pdo, $userId) {
    $stmt = $pdo->prepare("SELECT id, name, description, launch_command, icon_type, display_order FROM programs WHERE user_id = :user_id ORDER BY display_order ASC");
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    $programs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // No need for 'success' wrapper here, just output the array for the JSON file
    // The client side will create the JSON file.
    // Set filename for download (optional, JS can also do this)
    // header('Content-Disposition: attachment; filename="creation_hub_data.json"');
    echo json_encode($programs); // Just the array of programs
}

?>
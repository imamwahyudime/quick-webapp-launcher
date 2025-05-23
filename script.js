// script.js
// --- CREATION HUB APPLICATION ---
const CreationHubApp = (() => {
    // --- API ENDPOINTS ---
    const API_BASE_URL = ''; // Assuming PHP files are in the same directory
    const AUTH_API = `${API_BASE_URL}auth_api.php`;
    const PROGRAMS_API = `${API_BASE_URL}programs_api.php`;

    // --- STATE & CONFIGURATION ---
    let myPrograms = [];
    let currentUser = null; // To store { username: '...', isAdmin: false }

    // --- DOM ELEMENTS CACHE ---
    const dom = {
        programListContainer: null,
        emptyStateMessage: null,
        addEditModal: null,
        modalTitle: null,
        addEditForm: null,
        programIdInput: null,
        programNameInput: null,
        programDescriptionInput: null,
        programLaunchCommandInput: null,
        programIconTypeInput: null,
        cancelAddEditButton: null,
        addNewProgramButton: null,
        helpModal: null,
        helpButton: null,
        closeHelpModalButton: null,
        importDataButtonTrigger: null, // Renamed in HTML
        importFileInput: null,
        exportDataButton: null,
        toastNotification: null,
        selectFileForPreFillButton: null,
        programFileInputForPreFill: null,
        // New Auth related DOM elements
        loginModal: null,
        loginForm: null,
        usernameInput: null,
        passwordInput: null,
        cancelLoginButton: null,
        submitLoginButton: null,
        loginButton: null,
        logoutButton: null,
        loggedInUserDisplay: null,
        loginErrorMessage: null,
        authRequiredElements: [] // To store elements that require auth
    };

    /**
     * Caches all necessary DOM elements when the script loads.
     */
    function cacheDomElements() {
        dom.programListContainer = document.getElementById('program-list');
        dom.emptyStateMessage = document.getElementById('emptyStateMessage');
        dom.addEditModal = document.getElementById('addEditModal');
        dom.modalTitle = document.getElementById('modalTitle');
        dom.addEditForm = document.getElementById('addEditForm');
        dom.programIdInput = document.getElementById('programIdInput');
        dom.programNameInput = document.getElementById('programNameInput');
        dom.programDescriptionInput = document.getElementById('programDescriptionInput');
        dom.programLaunchCommandInput = document.getElementById('programLaunchCommandInput');
        dom.programIconTypeInput = document.getElementById('programIconTypeInput');
        dom.cancelAddEditButton = document.getElementById('cancelAddEditButton');
        dom.addNewProgramButton = document.getElementById('addNewProgramButton');
        dom.helpModal = document.getElementById('helpModal');
        dom.helpButton = document.getElementById('helpButton');
        dom.closeHelpModalButton = document.getElementById('closeHelpModalButton');
        dom.importDataButtonTrigger = document.getElementById('importDataButtonTrigger');
        dom.importFileInput = document.getElementById('importFileInput');
        dom.exportDataButton = document.getElementById('exportDataButton');
        dom.toastNotification = document.getElementById('toastNotification');
        dom.selectFileForPreFillButton = document.getElementById('selectFileForPreFillButton');
        dom.programFileInputForPreFill = document.getElementById('programFileInput');

        // Auth elements
        dom.loginModal = document.getElementById('loginModal');
        dom.loginForm = document.getElementById('loginForm');
        dom.usernameInput = document.getElementById('usernameInput');
        dom.passwordInput = document.getElementById('passwordInput');
        dom.cancelLoginButton = document.getElementById('cancelLoginButton');
        dom.submitLoginButton = document.getElementById('submitLoginButton'); // Make sure this ID exists on the login submit button
        dom.loginButton = document.getElementById('loginButton');
        dom.logoutButton = document.getElementById('logoutButton');
        dom.loggedInUserDisplay = document.getElementById('loggedInUser');
        dom.loginErrorMessage = document.getElementById('loginErrorMessage');
        dom.authRequiredElements = document.querySelectorAll('.requires-auth');
    }

    // --- UTILITIES ---
    /**
     * Generates SVG string for a given icon type. (Unchanged)
     * @param {string} iconType - The type of icon.
     * @returns {string} SVG string.
     */
    function getIconSVG(iconType) {
        const icons = {
            'code': `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>`,
            'game': `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>`,
            'chart': `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-12M6 16.5v3M18 16.5v3m-12-3h12M3.75 14.25V3m0 11.25a2.25 2.25 0 002.25 2.25h12a2.25 2.25 0 002.25-2.25V3" /></svg>`,
            'file-text': `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>`,
            'briefcase': `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.073a2.25 2.25 0 01-2.25 2.25h-12a2.25 2.25 0 01-2.25-2.25V14.15M15.75 18.75V16.5M15.75 12H18m-3.75 0H8.25m0 0H6M12 6.75V3.75m0 3H8.25M12 3.75H18m-5.25 0H8.25" /></svg>`,
            'image': `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.158 0L10.5 9.75M10.5 8.25L12 9.75m4.5-4.5h.008v.008h-.008V5.25z" /></svg>`,
            'default': `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5.16 12.562a2.25 2.25 0 000 3.182L8.44 18.04a2.25 2.25 0 003.182 0l3.262-3.262a2.25 2.25 0 00.659-1.591V3.104M15.75 12C15.75 14.071 14.071 15.75 12 15.75S8.25 14.071 8.25 12S9.929 8.25 12 8.25 15.75 9.929 15.75 12z" /></svg>`
        };
        return icons[iconType] || icons['default'];
    }

    /**
     * Shows a toast notification. (Unchanged)
     * @param {string} message - The message to display.
     * @param {boolean} [isError=false] - True if it's an error toast.
     */
    function showToast(message, isError = false) {
        dom.toastNotification.textContent = message;
        dom.toastNotification.className = 'toast show'; // Ensure 'toast' class is always present
        if (isError) {
            dom.toastNotification.classList.add('error');
        } else {
            dom.toastNotification.classList.remove('error'); // Ensure error class is removed if not an error
        }
        setTimeout(() => {
            dom.toastNotification.classList.remove('show');
        }, 3000);
    }

    // --- API HELPERS ---
    async function apiRequest(url, method = 'GET', body = null) {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
        };
        if (body) {
            options.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    errorData = { message: `HTTP error! Status: ${response.status}` };
                }
                throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
            }
            // Handle cases where backend sends non-JSON success response (e.g. for export)
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                return response.json();
            } else {
                return response.text(); // Or blob, arrayBuffer, etc., depending on expected non-JSON response
            }
        } catch (error) {
            console.error('API Request Error:', error);
            showToast(error.message || 'An API error occurred.', true);
            throw error; // Re-throw to be caught by calling function if needed
        }
    }


    // --- AUTHENTICATION ---
    async function checkLoginStatus() {
        try {
            const data = await apiRequest(`${AUTH_API}?action=status`, 'GET');
            if (data.success && data.loggedIn) {
                currentUser = data.user;
                updateUIAfterLogin();
                fetchPrograms(); // Fetch programs after confirming login
            } else {
                currentUser = null;
                updateUIAfterLogout();
            }
        } catch (error) {
            currentUser = null;
            updateUIAfterLogout();
            // Don't show toast for initial status check failure, might be expected
            console.warn("Not logged in or session expired.");
        }
    }

    async function handleLogin(event) {
        event.preventDefault();
        dom.loginErrorMessage.classList.add('hidden');
        const username = dom.usernameInput.value.trim();
        const password = dom.passwordInput.value;

        if (!username || !password) {
            showToast("Username and password are required.", true);
            return;
        }

        try {
            const data = await apiRequest(`${AUTH_API}?action=login`, 'POST', { username, password });
            if (data.success) {
                currentUser = data.user;
                showToast('Login successful!');
                closeLoginModal();
                updateUIAfterLogin();
                fetchPrograms(); // Fetch programs for the logged-in user
            } else {
                // This else might not be reached if apiRequest throws on !response.ok
                dom.loginErrorMessage.textContent = data.message || "Login failed. Please try again.";
                dom.loginErrorMessage.classList.remove('hidden');
                showToast(data.message || "Login failed.", true);
            }
        } catch (error) {
             // Error already shown by apiRequest, but specific login error message can be set here
            dom.loginErrorMessage.textContent = error.message || "Login failed due to a server error.";
            dom.loginErrorMessage.classList.remove('hidden');
        }
    }

    async function handleLogout() {
        try {
            const data = await apiRequest(`${AUTH_API}?action=logout`, 'POST');
            if (data.success) {
                showToast('Logout successful!');
            } else {
                showToast(data.message || 'Logout failed.', true);
            }
        } catch (error) {
            // Error already shown by apiRequest
        } finally {
            currentUser = null;
            myPrograms = []; // Clear programs on logout
            updateUIAfterLogout();
            renderProgramList(); // Re-render to show empty state or login prompt
        }
    }

    function updateUIAfterLogin() {
        if (!currentUser) return;
        dom.loginButton.classList.add('hidden');
        dom.logoutButton.classList.remove('hidden');
        if(dom.loggedInUserDisplay) dom.loggedInUserDisplay.textContent = `Logged in as: ${currentUser.username}`;

        dom.authRequiredElements.forEach(el => el.classList.remove('hidden'));
        // Enable drag-and-drop if it was disabled
        if (sortableInstance) sortableInstance.option("disabled", false);
        renderProgramList(); // Re-render to show action buttons on cards
    }

    function updateUIAfterLogout() {
        dom.loginButton.classList.remove('hidden');
        dom.logoutButton.classList.add('hidden');
        if(dom.loggedInUserDisplay) dom.loggedInUserDisplay.textContent = '';
        myPrograms = []; // Clear programs array
        renderProgramList(); // Render empty list or prompt to log in

        dom.authRequiredElements.forEach(el => el.classList.add('hidden'));
        // Disable drag-and-drop
        if (sortableInstance) sortableInstance.option("disabled", true);

        closeAddEditModal(); // Close any open modals that require auth
    }


    // --- PROGRAM DATA MANAGEMENT (Now via API) ---
    async function fetchPrograms() {
        if (!currentUser) {
            myPrograms = [];
            renderProgramList();
            return;
        }
        try {
            const data = await apiRequest(`${PROGRAMS_API}?action=fetch`, 'GET');
            if (data.success) {
                myPrograms = data.programs || [];
            } else {
                myPrograms = [];
                showToast(data.message || 'Could not fetch programs.', true);
            }
        } catch (error) {
            myPrograms = [];
            // Error toast is already handled by apiRequest
        }
        renderProgramList();
    }


    // --- RENDERING ---
    function renderProgramList() {
        dom.programListContainer.innerHTML = '';
        if (!currentUser) {
             dom.emptyStateMessage.textContent = "Please log in to see your Creation Hub.";
             dom.emptyStateMessage.classList.remove('hidden');
             return;
        }

        if (myPrograms.length === 0) {
            dom.emptyStateMessage.textContent = 'Your hub is empty. Click "Add New" to get started!';
            dom.emptyStateMessage.classList.remove('hidden');
        } else {
            dom.emptyStateMessage.classList.add('hidden');
        }

        myPrograms.forEach(program => {
            const card = document.createElement('div');
            card.className = 'program-card';
            card.setAttribute('data-id', program.id);

            // Card actions (Edit, Delete) - only if logged in
            if (currentUser) {
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'card-actions';
                const editButton = document.createElement('button');
                editButton.className = 'action-button edit-button';
                editButton.innerHTML = '<i class="fas fa-pencil-alt text-blue-300"></i>';
                editButton.title = "Edit Program";
                editButton.onclick = (e) => { e.stopPropagation(); openAddEditModal('edit', program.id); };
                actionsDiv.appendChild(editButton);
                const deleteButton = document.createElement('button');
                deleteButton.className = 'action-button delete-button';
                deleteButton.innerHTML = '<i class="fas fa-trash-alt text-red-400"></i>';
                deleteButton.title = "Delete Program";
                deleteButton.onclick = (e) => { e.stopPropagation(); deleteProgram(program.id); };
                actionsDiv.appendChild(deleteButton);
                card.appendChild(actionsDiv);
            }


            const iconPlaceholder = document.createElement('div');
            iconPlaceholder.className = 'program-icon-placeholder';
            iconPlaceholder.innerHTML = getIconSVG(program.iconType);

            const infoDiv = document.createElement('div');
            infoDiv.className = 'p-6 flex flex-col flex-grow';
            const name = document.createElement('h3');
            name.className = 'text-xl font-semibold text-white mb-2';
            name.textContent = program.name;
            const description = document.createElement('p');
            description.className = 'text-gray-400 text-sm mb-4 flex-grow';
            description.textContent = program.description;
            const launchButton = document.createElement('button');
            launchButton.className = 'launch-button mt-auto';
            launchButton.innerHTML = '<i class="fas fa-play mr-2"></i>Open';
            launchButton.onclick = (e) => { e.stopPropagation(); openProgramLink(program); };


            infoDiv.appendChild(name);
            infoDiv.appendChild(description);
            infoDiv.appendChild(launchButton);
            card.appendChild(iconPlaceholder); // Icon added after actions
            card.appendChild(infoDiv);
            dom.programListContainer.appendChild(card);
        });
        // No direct save to LocalStorage here; saving is per-action via API
    }

    // --- MODAL HANDLING & URL OPENING ---
    /**
     * Opens the program's launch command (URL) in a new tab. (Unchanged logic, just context)
     */
    function openProgramLink(program) {
        if (program && program.launch_command && program.launch_command.trim() !== "") { // field name from DB
            let url = program.launch_command.trim();
            if (!url.match(/^[a-zA-Z][a-zA-Z0-9+.-]*:/i) && !url.startsWith('//')) {
                url = 'https://' + url;
            }
            try {
                const newTab = window.open(url, '_blank', 'noopener,noreferrer');
                if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
                    showToast('Popup blocked. Please allow popups for this site.', true);
                }
            } catch (e) {
                console.error("Error opening URL:", e, "URL was:", url);
                showToast(`Could not open URL: '${url}'. Check the address.`, true);
            }
        } else {
            showToast("Launch command is empty or invalid. Please provide a URL.", true);
        }
    }

    function openAddEditModal(mode, programId = null) {
        if (!currentUser) {
            showToast("Please log in to manage programs.", true);
            openLoginModal();
            return;
        }
        dom.addEditForm.reset();
        dom.programIdInput.value = '';
        dom.programFileInputForPreFill.value = '';
        if (mode === 'edit' && programId) {
            const program = myPrograms.find(p => p.id === programId);
            if (program) {
                dom.modalTitle.textContent = 'Edit Program';
                dom.programIdInput.value = program.id;
                dom.programNameInput.value = program.name;
                dom.programDescriptionInput.value = program.description;
                dom.programLaunchCommandInput.value = program.launch_command; // DB field name
                dom.programIconTypeInput.value = program.iconType || program.icon_type; // DB field name
            } else {
                showToast("Error: Program not found for editing.", true);
                return;
            }
        } else {
            dom.modalTitle.textContent = 'Add New Program';
        }
        dom.addEditModal.classList.add('active');
    }

    function closeAddEditModal() { dom.addEditModal.classList.remove('active'); }
    function closeHelpModal() { dom.helpModal.classList.remove('active'); }
    function showHelpModal() { dom.helpModal.classList.add('active'); }
    function openLoginModal() {
        dom.loginForm.reset();
        dom.loginErrorMessage.classList.add('hidden');
        dom.loginModal.classList.add('active');
        dom.usernameInput.focus();
    }
    function closeLoginModal() { dom.loginModal.classList.remove('active'); }


    // --- CRUD OPERATIONS via API ---
    async function handleAddEditFormSubmit(event) {
        event.preventDefault();
        if (!currentUser) {
            showToast("Please log in to save programs.", true);
            openLoginModal();
            return;
        }

        const id = dom.programIdInput.value; // Will be empty for 'add'
        const name = dom.programNameInput.value.trim();
        const description = dom.programDescriptionInput.value.trim();
        const launchCommand = dom.programLaunchCommandInput.value.trim();
        const iconType = dom.programIconTypeInput.value;

        if (!name || !launchCommand) { // Description can be optional
            showToast("Please fill in Name and Launch URL.", true);
            return;
        }

        const programData = { name, description, launchCommand, iconType };
        let url, method;

        if (id) { // Editing existing program
            programData.id = id; // Pass id for update to ensure correct item is updated
            url = `${PROGRAMS_API}?action=update&id=${id}`;
            method = 'POST'; // Or PUT
        } else { // Adding new program
            // ID will be generated by backend if not provided, or we can generate one
            // programData.id = `prog_${Date.now()}`; // Or let backend handle ID
            url = `${PROGRAMS_API}?action=add`;
            method = 'POST';
        }

        try {
            const data = await apiRequest(url, method, programData);
            if (data.success) {
                showToast(id ? "Program updated successfully!" : "Program added successfully!");
                fetchPrograms(); // Refresh the list from server
                closeAddEditModal();
            } else {
                showToast(data.message || `Could not ${id ? 'update' : 'add'} program.`, true);
            }
        } catch (error) {
            // Error already shown by apiRequest
        }
    }

    async function deleteProgram(programId) {
        if (!currentUser) {
            showToast("Please log in to delete programs.", true);
            openLoginModal();
            return;
        }
        const program = myPrograms.find(p => p.id === programId);
        if (confirm(`Are you sure you want to delete "${program ? program.name : 'this program'}"? This cannot be undone.`)) {
            try {
                const data = await apiRequest(`${PROGRAMS_API}?action=delete&id=${programId}`, 'POST'); // Or DELETE
                if (data.success) {
                    showToast("Program deleted.");
                    fetchPrograms(); // Refresh list
                } else {
                    showToast(data.message || "Could not delete program.", true);
                }
            } catch (error) {
                // Error already shown by apiRequest
            }
        }
    }

    // --- FEATURE INITIALIZATION ---
    let sortableInstance = null;
    function initializeDragAndDrop() {
        if (dom.programListContainer) {
            sortableInstance = new Sortable(dom.programListContainer, {
                animation: 150,
                ghostClass: 'sortable-ghost',
                disabled: !currentUser, // Initially disable if not logged in
                onEnd: async function (evt) {
                    if (!currentUser) return; // Should not happen if disabled

                    // Update local array order immediately for responsiveness
                    const movedProgram = myPrograms.splice(evt.oldIndex, 1)[0];
                    myPrograms.splice(evt.newIndex, 0, movedProgram);
                    // Re-render with new local order. Optional, server will send definitive order.
                    // renderProgramList();

                    const orderedIds = myPrograms.map(p => p.id);
                    try {
                        const data = await apiRequest(`${PROGRAMS_API}?action=reorder`, 'POST', { orderedIds });
                        if (data.success) {
                            showToast("Order saved to server!");
                            // Optionally fetchPrograms() here to ensure sync,
                            // but optimistic update is usually fine.
                        } else {
                            showToast(data.message || "Could not save order.", true);
                            fetchPrograms(); // Re-fetch to correct potential mismatch
                        }
                    } catch (error) {
                        fetchPrograms(); // Re-fetch on error
                    }
                }
            });
        }
    }

    async function exportData() {
        if (!currentUser) {
            showToast("Please log in to export data.", true);
            openLoginModal();
            return;
        }
        if (myPrograms.length === 0) {
            showToast("Nothing to export. Add some programs first!", true);
            return;
        }
        try {
            // The programs_api.php for export directly returns the JSON array string
            const jsonData = await apiRequest(`${PROGRAMS_API}?action=export`, 'GET');
            // jsonData here is already a string because apiRequest handles non-JSON responses as text.
            // If it were parsed JSON, it would be: const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'creation_hub_data.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast("Data exported successfully!");
        } catch (error) {
            showToast("Could not export data.", true);
        }
    }

    function importData(event) {
        if (!currentUser) {
            showToast("Please log in to import data.", true);
            openLoginModal();
            event.target.value = ''; // Reset file input
            return;
        }
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async function(e) {
                try {
                    const importedRawData = JSON.parse(e.target.result);
                    // The backend expects an object like { "programs": [...] }
                    // If your JSON file is just an array, wrap it.
                    let programsToImport;
                    if (Array.isArray(importedRawData)) {
                        programsToImport = importedRawData;
                    } else if (importedRawData && Array.isArray(importedRawData.programs)) {
                        programsToImport = importedRawData.programs;
                    } else {
                         showToast("Invalid file format. Expected a JSON array of programs or an object {programs: [...]}.", true);
                         return;
                    }


                    if (confirm("Importing this file will replace your current program list on the server with the content of this file. Are you sure?")) {
                        const data = await apiRequest(`${PROGRAMS_API}?action=import`, 'POST', { programs: programsToImport });
                        if (data.success) {
                            showToast(data.message || "Data imported successfully!");
                            fetchPrograms(); // Refresh list from server
                        } else {
                            showToast(data.message || "Import failed.", true);
                        }
                    }
                } catch (error) {
                    console.error("Error importing data:", error);
                    showToast(error.message || "Error reading or parsing the file. Make sure it's valid JSON.", true);
                } finally {
                    dom.importFileInput.value = ''; // Reset file input
                }
            };
            reader.readAsText(file);
        }
    }


    /**
     * Handles pre-filling form fields from a selected file. (Largely unchanged)
     */
    function preFillFormFromFile(event) {
        const file = event.target.files[0];
        if (file) {
            const fileNameWithoutExtension = file.name.split('.').slice(0, -1).join('.') || file.name;
            dom.programNameInput.value = fileNameWithoutExtension;
            dom.programLaunchCommandInput.value = file.name; // User still needs to change this to URL
            showToast("Fields pre-filled. REPLACE Launch Command with a valid URL.", false);
        }
        dom.programFileInputForPreFill.value = '';
    }

    // --- EVENT LISTENERS ---
    function bindEventListeners() {
        dom.addNewProgramButton.onclick = () => openAddEditModal('add');
        dom.cancelAddEditButton.onclick = closeAddEditModal;
        dom.addEditForm.onsubmit = handleAddEditFormSubmit;

        dom.helpButton.onclick = showHelpModal;
        dom.closeHelpModalButton.onclick = closeHelpModal;

        dom.exportDataButton.onclick = exportData;
        dom.importDataButtonTrigger.onclick = () => dom.importFileInput.click(); // Changed ID
        dom.importFileInput.onchange = importData;

        dom.selectFileForPreFillButton.onclick = () => dom.programFileInputForPreFill.click();
        dom.programFileInputForPreFill.onchange = preFillFormFromFile;

        // Auth Listeners
        dom.loginButton.onclick = openLoginModal;
        dom.logoutButton.onclick = handleLogout;
        dom.loginForm.onsubmit = handleLogin;
        dom.cancelLoginButton.onclick = closeLoginModal;


        // Global click listener for closing modals
        window.onclick = (event) => {
            if (event.target == dom.addEditModal) closeAddEditModal();
            if (event.target == dom.helpModal) closeHelpModal();
            if (event.target == dom.loginModal) closeLoginModal();
        };
    }

    // --- INITIALIZATION ---
    async function init() {
        cacheDomElements();
        bindEventListeners();
        updateUIAfterLogout(); // Set initial UI state to logged-out
        await checkLoginStatus(); // Check login status and update UI accordingly
        initializeDragAndDrop(); // Initialize drag and drop, will be enabled/disabled based on login
        // Initial fetchPrograms is called within checkLoginStatus if successful
    }

    return {
        init: init
    };
})();

// --- START THE APPLICATION ---
window.onload = CreationHubApp.init;
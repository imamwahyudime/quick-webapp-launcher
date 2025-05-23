// script.js
// --- CREATION HUB APPLICATION (Public View / Admin Edit) ---
const CreationHubApp = (() => {
    // --- API ENDPOINTS ---
    const API_BASE_URL = ''; // Assuming PHP files are in the same directory
    const AUTH_API = `${API_BASE_URL}auth_api.php`;
    const PROGRAMS_API = `${API_BASE_URL}programs_api.php`;

    // --- STATE & CONFIGURATION ---
    let myPrograms = [];
    let currentUser = null; // To store { username: '...', isAdmin: false/true }

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
        importDataButtonTrigger: null,
        importFileInput: null,
        exportDataButton: null,
        toastNotification: null,
        selectFileForPreFillButton: null,
        programFileInputForPreFill: null,
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
        adminRequiredElements: [] // Elements that require admin privileges
    };

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
        dom.loginModal = document.getElementById('loginModal');
        dom.loginForm = document.getElementById('loginForm');
        dom.usernameInput = document.getElementById('usernameInput');
        dom.passwordInput = document.getElementById('passwordInput');
        dom.cancelLoginButton = document.getElementById('cancelLoginButton');
        dom.submitLoginButton = document.getElementById('submitLoginButton');
        dom.loginButton = document.getElementById('loginButton');
        dom.logoutButton = document.getElementById('logoutButton');
        dom.loggedInUserDisplay = document.getElementById('loggedInUser');
        dom.loginErrorMessage = document.getElementById('loginErrorMessage');
        // Changed selector to .requires-admin as per HTML update
        dom.adminRequiredElements = document.querySelectorAll('.requires-admin');
    }

    // --- UTILITIES --- (getIconSVG, showToast remain unchanged)
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
    function showToast(message, isError = false) {
        dom.toastNotification.textContent = message;
        dom.toastNotification.className = 'toast show';
        if (isError) {
            dom.toastNotification.classList.add('error');
        } else {
            dom.toastNotification.classList.remove('error');
        }
        setTimeout(() => {
            dom.toastNotification.classList.remove('show');
        }, 3000);
    }

    // --- API HELPERS --- (apiRequest remains unchanged)
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
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                return response.json();
            } else {
                return response.text();
            }
        } catch (error) {
            console.error('API Request Error:', error);
            showToast(error.message || 'An API error occurred.', true);
            throw error;
        }
    }

    // --- AUTHENTICATION ---
    async function checkLoginStatus() {
        try {
            const data = await apiRequest(`${AUTH_API}?action=status`, 'GET');
            if (data.success && data.loggedIn) {
                currentUser = data.user; // user should include { username: '...', isAdmin: true/false }
                updateUIForAuthChange();
            } else {
                currentUser = null;
                updateUIForAuthChange();
            }
        } catch (error) {
            currentUser = null;
            updateUIForAuthChange();
            console.warn("Session check failed or not logged in.");
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
                updateUIForAuthChange();
                // Programs are fetched on init and after auth change, so not strictly needed here unless force refresh
            } else {
                dom.loginErrorMessage.textContent = data.message || "Login failed.";
                dom.loginErrorMessage.classList.remove('hidden');
                // showToast already handled by apiRequest for error
            }
        } catch (error) {
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
                // showToast already handled by apiRequest for error
            }
        } catch (error) {
            // Error already shown
        } finally {
            currentUser = null;
            updateUIForAuthChange();
            // Program list remains public, no need to clear `myPrograms` here unless we want to force a re-fetch
            // which fetchPrograms() will do if called by updateUIForAuthChange or init.
        }
    }

    function updateUIForAuthChange() {
        if (currentUser) {
            dom.loginButton.classList.add('hidden');
            dom.logoutButton.classList.remove('hidden');
            dom.loggedInUserDisplay.textContent = `Logged in as: ${currentUser.username}${currentUser.isAdmin ? ' (Admin)' : ''}`;

            if (currentUser.isAdmin) {
                dom.adminRequiredElements.forEach(el => el.classList.remove('hidden'));
                if (sortableInstance) sortableInstance.option("disabled", false);
            } else { // Logged in but not admin
                dom.adminRequiredElements.forEach(el => el.classList.add('hidden'));
                if (sortableInstance) sortableInstance.option("disabled", true);
            }
        } else { // Logged out
            dom.loginButton.classList.remove('hidden');
            dom.logoutButton.classList.add('hidden');
            dom.loggedInUserDisplay.textContent = '';
            dom.adminRequiredElements.forEach(el => el.classList.add('hidden'));
            if (sortableInstance) sortableInstance.option("disabled", true);
            closeAddEditModal(); // Close admin modal if open
        }
        renderProgramList(); // Re-render to show/hide card actions based on admin status
    }

    // --- PROGRAM DATA MANAGEMENT (Public Fetch, Admin Edit) ---
    async function fetchPrograms() {
        try {
            const data = await apiRequest(`${PROGRAMS_API}?action=fetch`, 'GET');
            if (data.success) {
                myPrograms = data.programs || [];
            } else {
                myPrograms = [];
                // showToast handled by apiRequest
            }
        } catch (error) {
            myPrograms = [];
        }
        renderProgramList(); // Always render, even if empty or error
    }

    // --- RENDERING ---
    function renderProgramList() {
        dom.programListContainer.innerHTML = '';
        if (myPrograms.length === 0) {
            dom.emptyStateMessage.textContent = 'The Creation Hub is currently empty. An administrator can add new items.';
            dom.emptyStateMessage.classList.remove('hidden');
        } else {
            dom.emptyStateMessage.classList.add('hidden');
        }

        myPrograms.forEach(program => {
            const card = document.createElement('div');
            card.className = 'program-card';
            card.setAttribute('data-id', program.id);

            // Card actions (Edit, Delete) - only if admin
            if (currentUser && currentUser.isAdmin) {
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
            iconPlaceholder.innerHTML = getIconSVG(program.icon_type); // Use snake_case from DB

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
            card.appendChild(iconPlaceholder);
            card.appendChild(infoDiv);
            dom.programListContainer.appendChild(card);
        });
    }

    // --- MODAL HANDLING & URL OPENING ---
    function openProgramLink(program) { // launch_command from DB
        if (program && program.launch_command && program.launch_command.trim() !== "") {
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
                showToast(`Could not open URL: '${url}'. Check address.`, true);
            }
        } else {
            showToast("Launch command is empty or invalid.", true);
        }
    }

    function openAddEditModal(mode, programId = null) {
        if (!currentUser || !currentUser.isAdmin) {
            showToast("Administrator access required to manage programs.", true);
            if (!currentUser) openLoginModal(); // Prompt login if not logged in at all
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
                dom.programLaunchCommandInput.value = program.launch_command; // from DB
                dom.programIconTypeInput.value = program.icon_type; // from DB
            } else {
                showToast("Error: Program not found for editing.", true); return;
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

    // --- CRUD OPERATIONS (Admin Only for Write Ops) ---
    async function handleAddEditFormSubmit(event) {
        event.preventDefault();
        if (!currentUser || !currentUser.isAdmin) {
            showToast("Administrator access required.", true); return;
        }
        const id = dom.programIdInput.value;
        const name = dom.programNameInput.value.trim();
        const description = dom.programDescriptionInput.value.trim();
        // Ensure field names match what PHP API expects for $data keys (camelCase)
        const launchCommand = dom.programLaunchCommandInput.value.trim();
        const iconType = dom.programIconTypeInput.value;

        if (!name || !launchCommand) {
            showToast("Name and Launch URL are required.", true); return;
        }
        // Program data matches expected keys in PHP's handleAdd/UpdateProgram
        const programData = { name, description, launchCommand, iconType };
        let url, method;

        if (id) {
            programData.id = id;
            url = `${PROGRAMS_API}?action=update&id=${id}`; method = 'POST';
        } else {
            url = `${PROGRAMS_API}?action=add`; method = 'POST';
        }
        try {
            const data = await apiRequest(url, method, programData);
            if (data.success) {
                showToast(data.message || (id ? "Program updated!" : "Program added!"));
                fetchPrograms(); // Refresh public list
                closeAddEditModal();
            } // else: error toast handled by apiRequest
        } catch (error) { /* Handled by apiRequest */ }
    }

    async function deleteProgram(programId) {
        if (!currentUser || !currentUser.isAdmin) {
            showToast("Administrator access required.", true); return;
        }
        const program = myPrograms.find(p => p.id === programId);
        if (confirm(`Are you sure you want to delete "${program ? program.name : 'this program'}"?`)) {
            try {
                const data = await apiRequest(`${PROGRAMS_API}?action=delete&id=${programId}`, 'POST');
                if (data.success) {
                    showToast(data.message || "Program deleted.");
                    fetchPrograms();
                } // else: error toast handled by apiRequest
            } catch (error) { /* Handled by apiRequest */ }
        }
    }

    // --- FEATURE INITIALIZATION ---
    let sortableInstance = null;
    function initializeDragAndDrop() {
        if (dom.programListContainer) {
            sortableInstance = new Sortable(dom.programListContainer, {
                animation: 150,
                ghostClass: 'sortable-ghost',
                disabled: !(currentUser && currentUser.isAdmin), // Enable only if admin
                onEnd: async function (evt) {
                    if (!currentUser || !currentUser.isAdmin) return;

                    const tempOrderedPrograms = Array.from(dom.programListContainer.children).map(card => {
                        const id = card.getAttribute('data-id');
                        return myPrograms.find(p => p.id === id);
                    }).filter(p => p); // Filter out undefined if any card somehow has no matching program

                    // Update myPrograms array to reflect the new visual order
                    myPrograms = tempOrderedPrograms;

                    const orderedIds = myPrograms.map(p => p.id);

                    try {
                        const data = await apiRequest(`${PROGRAMS_API}?action=reorder`, 'POST', { orderedIds });
                        if (data.success) {
                            showToast(data.message || "Order saved!");
                            // Optional: fetchPrograms() to get definitive server order,
                            // but optimistic update is usually fine.
                        } else { fetchPrograms(); /* Re-fetch to correct order on failure */ }
                    } catch (error) { fetchPrograms(); /* Re-fetch on error */ }
                }
            });
        }
    }

    async function exportData() { // Publicly accessible
        if (myPrograms.length === 0) {
            showToast("Nothing to export.", true); return;
        }
        try {
            const jsonDataString = await apiRequest(`${PROGRAMS_API}?action=export`, 'GET');
            const blob = new Blob([jsonDataString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'creation_hub_data.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast("Data exported successfully!");
        } catch (error) { /* Handled by apiRequest */ }
    }

    function importData(event) { // Admin only
        if (!currentUser || !currentUser.isAdmin) {
            showToast("Administrator access required to import.", true);
            if (!currentUser) openLoginModal();
            event.target.value = ''; return;
        }
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async function(e) {
                try {
                    const importedRawData = JSON.parse(e.target.result);
                    let programsToImport = Array.isArray(importedRawData) ? importedRawData : (importedRawData.programs || []);

                    if (confirm("ADMIN ACTION: Importing this file will REPLACE the current public program list on the server. Are you sure?")) {
                        const data = await apiRequest(`${PROGRAMS_API}?action=import`, 'POST', { programs: programsToImport });
                        if (data.success) {
                            showToast(data.message || "Data imported successfully!");
                            fetchPrograms();
                        } // else: error handled by apiRequest
                    }
                } catch (errorParsing) {
                    showToast(errorParsing.message || "Error reading/parsing file.", true);
                } finally {
                    dom.importFileInput.value = '';
                }
            };
            reader.readAsText(file);
        }
    }

    function preFillFormFromFile(event) { // Admin context for opening add/edit modal
        if (!currentUser || !currentUser.isAdmin) {
            showToast("Administrator access required.", true); return;
        }
        const file = event.target.files[0];
        if (file) {
            const fileNameWithoutExtension = file.name.split('.').slice(0, -1).join('.') || file.name;
            dom.programNameInput.value = fileNameWithoutExtension;
            dom.programLaunchCommandInput.value = file.name;
            showToast("Fields pre-filled. REPLACE Launch Command with a valid URL.", false);
        }
        dom.programFileInputForPreFill.value = '';
    }

    // --- EVENT LISTENERS ---
    function bindEventListeners() {
        dom.addNewProgramButton.onclick = () => openAddEditModal('add'); // Admin check inside openAddEditModal
        dom.cancelAddEditButton.onclick = closeAddEditModal;
        dom.addEditForm.onsubmit = handleAddEditFormSubmit; // Admin check inside submit handler
        dom.helpButton.onclick = showHelpModal;
        dom.closeHelpModalButton.onclick = closeHelpModal;
        dom.exportDataButton.onclick = exportData; // Public
        dom.importDataButtonTrigger.onclick = () => { // Admin check inside importData
            if (!currentUser || !currentUser.isAdmin) {
                showToast("Administrator access required.", true);
                if (!currentUser) openLoginModal();
                return;
            }
            dom.importFileInput.click();
        };
        dom.importFileInput.onchange = importData; // Admin check inside importData
        dom.selectFileForPreFillButton.onclick = () => { // Admin check inside preFill
             if (!currentUser || !currentUser.isAdmin) {
                showToast("Administrator access required.", true);
                if (!currentUser) openLoginModal();
                return;
             }
            dom.programFileInputForPreFill.click();
        }
        dom.programFileInputForPreFill.onchange = preFillFormFromFile;
        dom.loginButton.onclick = openLoginModal;
        dom.logoutButton.onclick = handleLogout;
        dom.loginForm.onsubmit = handleLogin;
        dom.cancelLoginButton.onclick = closeLoginModal;
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
        updateUIForAuthChange(); // Set initial UI (logged out state, hides admin elements)
        await fetchPrograms();    // Fetch public programs first
        await checkLoginStatus(); // Check login and update UI for admin if applicable
        initializeDragAndDrop();  // Initialize, will be enabled/disabled based on admin status
    }

    return { init: init };
})();

window.onload = CreationHubApp.init;
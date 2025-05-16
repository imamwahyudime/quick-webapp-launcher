// script.js
// --- CREATION HUB APPLICATION ---
const CreationHubApp = (() => {
    // --- STATE & CONFIGURATION ---
    const LOCAL_STORAGE_KEY = 'myCreationHubPrograms';
    let myPrograms = [];

    // --- DOM ELEMENTS CACHE ---
    // Caching DOM elements for performance and easier access
    const dom = {
        programListContainer: null,
        emptyStateMessage: null,
        launchModal: null,
        modalProgramNameLaunch: null,
        modalProgramDescriptionLaunch: null,
        closeLaunchModalButton: null,
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
        importDataButton: null,
        importFileInput: null,
        exportDataButton: null,
        toastNotification: null,
        selectFileForPreFillButton: null,
        programFileInputForPreFill: null
    };

    /**
     * Caches all necessary DOM elements when the script loads.
     */
    function cacheDomElements() {
        dom.programListContainer = document.getElementById('program-list');
        dom.emptyStateMessage = document.getElementById('emptyStateMessage');
        dom.launchModal = document.getElementById('launchModal');
        dom.modalProgramNameLaunch = document.getElementById('modalProgramNameLaunch');
        dom.modalProgramDescriptionLaunch = document.getElementById('modalProgramDescriptionLaunch');
        dom.closeLaunchModalButton = document.getElementById('closeLaunchModalButton');
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
        dom.importDataButton = document.getElementById('importDataButton');
        dom.importFileInput = document.getElementById('importFileInput');
        dom.exportDataButton = document.getElementById('exportDataButton');
        dom.toastNotification = document.getElementById('toastNotification');
        dom.selectFileForPreFillButton = document.getElementById('selectFileForPreFillButton');
        dom.programFileInputForPreFill = document.getElementById('programFileInput');
    }

    // --- UTILITIES ---
    /**
     * Generates SVG string for a given icon type.
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
     * Shows a toast notification.
     * @param {string} message - The message to display.
     * @param {boolean} [isError=false] - True if it's an error toast.
     */
    function showToast(message, isError = false) {
        dom.toastNotification.textContent = message;
        dom.toastNotification.className = 'toast show';
        if (isError) {
            dom.toastNotification.classList.add('error');
        }
        setTimeout(() => {
            dom.toastNotification.classList.remove('show');
        }, 3000);
    }

    // --- LOCALSTORAGE DATA MANAGEMENT ---
    /**
     * Loads program data from LocalStorage.
     */
    function loadDataFromLocalStorage() {
        const storedPrograms = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedPrograms) {
            try {
                myPrograms = JSON.parse(storedPrograms);
            } catch (e) {
                console.error("Error parsing programs from LocalStorage:", e);
                myPrograms = [];
                showToast("Error loading data from LocalStorage. Data might be corrupted.", true);
            }
        } else {
            // Default programs for first-time users
            myPrograms = [
                { id: "prog_default_1", name: "Example: My Game Project", description: "A fun game I'm working on.", iconType: "game", launchCommand: "\"C:\\Program Files\\ExampleGame\\game.exe\"" },
                { id: "prog_default_2", name: "Example: Text Editor", description: "For notes and code.", iconType: "file-text", launchCommand: "notepad.exe" },
            ];
        }
    }

    /**
     * Saves the current program data to LocalStorage.
     */
    function saveDataToLocalStorage() {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(myPrograms));
        } catch (e) {
            console.error("Error saving programs to LocalStorage:", e);
            showToast("Could not save data. Browser storage might be full or disabled.", true);
        }
    }

    // --- RENDERING ---
    /**
     * Renders the list of program cards to the DOM.
     */
    function renderProgramList() {
        dom.programListContainer.innerHTML = '';
        if (myPrograms.length === 0) {
            dom.emptyStateMessage.classList.remove('hidden');
        } else {
            dom.emptyStateMessage.classList.add('hidden');
        }

        myPrograms.forEach(program => {
            const card = document.createElement('div');
            card.className = 'program-card';
            card.setAttribute('data-id', program.id);

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
            launchButton.onclick = (e) => { e.stopPropagation(); showLaunchSimulationModal(program); };

            infoDiv.appendChild(name);
            infoDiv.appendChild(description);
            infoDiv.appendChild(launchButton);
            card.appendChild(actionsDiv);
            card.appendChild(iconPlaceholder);
            card.appendChild(infoDiv);
            dom.programListContainer.appendChild(card);
        });
        saveDataToLocalStorage();
    }

    // --- MODAL HANDLING ---
    /**
     * Shows the launch simulation modal.
     * @param {object} program - The program object to simulate launching.
     */
    function showLaunchSimulationModal(program) {
        dom.modalProgramNameLaunch.textContent = `Simulating: Launching ${program.name}...`;
        dom.modalProgramDescriptionLaunch.textContent = `Command: ${program.launchCommand}`;
        dom.launchModal.classList.add('active');
    }

    /**
     * Opens the Add/Edit program modal.
     * @param {string} mode - 'add' or 'edit'.
     * @param {string|null} [programId=null] - The ID of the program to edit.
     */
    function openAddEditModal(mode, programId = null) {
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
                dom.programLaunchCommandInput.value = program.launchCommand;
                dom.programIconTypeInput.value = program.iconType;
            } else {
                console.error("Program not found for editing:", programId);
                return;
            }
        } else {
            dom.modalTitle.textContent = 'Add New Program';
        }
        dom.addEditModal.classList.add('active');
    }

    /** Closes the Add/Edit modal. */
    function closeAddEditModal() { dom.addEditModal.classList.remove('active'); }
    /** Closes the Launch Simulation modal. */
    function closeLaunchModal() { dom.launchModal.classList.remove('active'); }
    /** Closes the Help modal. */
    function closeHelpModal() { dom.helpModal.classList.remove('active'); }
    /** Shows the Help modal. */
    function showHelpModal() { dom.helpModal.classList.add('active'); }


    // --- CRUD OPERATIONS ---
    /**
     * Handles the submission of the Add/Edit form.
     * @param {Event} event - The form submission event.
     */
    function handleAddEditFormSubmit(event) {
        event.preventDefault();
        const id = dom.programIdInput.value || `prog_${Date.now()}`;
        const name = dom.programNameInput.value.trim();
        const description = dom.programDescriptionInput.value.trim();
        const launchCommand = dom.programLaunchCommandInput.value.trim();
        const iconType = dom.programIconTypeInput.value;

        if (!name || !description || !launchCommand) {
            showToast("Please fill in all required fields.", true);
            return;
        }
        const programData = { id, name, description, launchCommand, iconType };
        if (dom.programIdInput.value) { // Editing
            const index = myPrograms.findIndex(p => p.id === id);
            if (index !== -1) myPrograms[index] = programData;
            showToast("Program updated successfully!");
        } else { // Adding
            myPrograms.push(programData);
            showToast("Program added successfully!");
        }
        renderProgramList();
        closeAddEditModal();
    }

    /**
     * Deletes a program after confirmation.
     * @param {string} programId - The ID of the program to delete.
     */
    function deleteProgram(programId) {
        const program = myPrograms.find(p => p.id === programId);
        if (confirm(`Are you sure you want to delete "${program ? program.name : 'this program'}"? This cannot be undone.`)) {
            myPrograms = myPrograms.filter(p => p.id !== programId);
            renderProgramList();
            showToast("Program deleted.");
        }
    }

    // --- FEATURE INITIALIZATION ---
    /**
     * Initializes drag and drop functionality using SortableJS.
     */
    function initializeDragAndDrop() {
        if (dom.programListContainer) {
            new Sortable(dom.programListContainer, {
                animation: 150,
                ghostClass: 'sortable-ghost',
                onEnd: function (evt) {
                    const movedProgram = myPrograms.splice(evt.oldIndex, 1)[0];
                    myPrograms.splice(evt.newIndex, 0, movedProgram);
                    saveDataToLocalStorage();
                    showToast("Order saved!");
                }
            });
        }
    }

    /**
     * Handles exporting program data to a JSON file.
     */
    function exportData() {
        if (myPrograms.length === 0) {
            showToast("Nothing to export. Add some programs first!", true);
            return;
        }
        const jsonData = JSON.stringify(myPrograms, null, 2);
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
    }

    /**
     * Handles importing program data from a JSON file.
     * @param {Event} event - The file input change event.
     */
    function importData(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const importedData = JSON.parse(e.target.result);
                    if (Array.isArray(importedData)) {
                        // Basic validation for imported items
                        const isValid = importedData.every(item =>
                            item.hasOwnProperty('id') &&
                            item.hasOwnProperty('name') &&
                            item.hasOwnProperty('description') &&
                            item.hasOwnProperty('launchCommand') &&
                            item.hasOwnProperty('iconType')
                        );
                        if (isValid || importedData.length === 0) {
                            if (confirm("Importing this file will replace your current program list. Are you sure?")) {
                                myPrograms = importedData;
                                renderProgramList();
                                showToast("Data imported successfully!");
                            }
                        } else {
                            showToast("Invalid file format. Ensure items have id, name, description, launchCommand, and iconType.", true);
                        }
                    } else {
                        showToast("Invalid file format. The file should contain a JSON array.", true);
                    }
                } catch (error) {
                    console.error("Error importing data:", error);
                    showToast("Error reading or parsing the file. Make sure it's a valid JSON.", true);
                } finally {
                    dom.importFileInput.value = '';
                }
            };
            reader.readAsText(file);
        }
    }

    /**
     * Handles pre-filling form fields from a selected file.
     * @param {Event} event - The file input change event.
     */
    function preFillFormFromFile(event) {
        const file = event.target.files[0];
        if (file) {
            const fileNameWithoutExtension = file.name.split('.').slice(0, -1).join('.') || file.name;
            dom.programNameInput.value = fileNameWithoutExtension;
            dom.programLaunchCommandInput.value = file.name;
            showToast("Fields pre-filled. Please VERIFY the Launch Command with the full path or correct command.", false);
        }
        dom.programFileInputForPreFill.value = '';
    }

    // --- EVENT LISTENERS ---
    /**
     * Attaches all necessary event listeners.
     */
    function bindEventListeners() {
        dom.closeLaunchModalButton.onclick = closeLaunchModal;
        dom.addNewProgramButton.onclick = () => openAddEditModal('add');
        dom.cancelAddEditButton.onclick = closeAddEditModal;
        dom.addEditForm.onsubmit = handleAddEditFormSubmit;
        dom.helpButton.onclick = showHelpModal;
        dom.closeHelpModalButton.onclick = closeHelpModal;
        dom.exportDataButton.onclick = exportData;
        dom.importDataButton.onclick = () => dom.importFileInput.click();
        dom.importFileInput.onchange = importData;
        dom.selectFileForPreFillButton.onclick = () => dom.programFileInputForPreFill.click();
        dom.programFileInputForPreFill.onchange = preFillFormFromFile;

        // Global click listener for closing modals
        window.onclick = (event) => {
            if (event.target == dom.launchModal) closeLaunchModal();
            if (event.target == dom.addEditModal) closeAddEditModal();
            if (event.target == dom.helpModal) closeHelpModal();
        };
    }

    // --- INITIALIZATION ---
    /**
     * Initializes the application.
     */
    function init() {
        cacheDomElements(); // Cache DOM elements first
        loadDataFromLocalStorage();
        renderProgramList();
        bindEventListeners();
        initializeDragAndDrop();
    }

    // --- PUBLIC API (if any parts need to be exposed, otherwise not necessary for IIFE) ---
    return {
        init: init
        // Potentially expose other methods if needed for debugging or external calls
    };
})();

// --- START THE APPLICATION ---
window.onload = CreationHubApp.init;

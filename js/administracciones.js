document.addEventListener("DOMContentLoaded", () => {
    // ----- Gestión de Clientes -----
    const newUserBtn = document.getElementById("new-user-btn");
    const userFormContainer = document.getElementById("user-form-container");
    const cancelUserBtn = document.getElementById("cancel-user");
    const clientForm = document.getElementById("client-form");
    const clientsTableBody = document.querySelector("#clients-table tbody");

    // ----- Gestión de Espacios -----
    const spaceForm = document.getElementById("space-form");
    const spaceTypeSelect = document.getElementById("space-type");
    const parkingGrid = document.getElementById("parking-grid");
    const availableSpaces = document.getElementById("available-spaces");
    const totalSpaces = document.getElementById("total-spaces");

    let total = 0;

    // =====================
    // Modal flotante de edición de cliente
    // =====================
    let editClientModal = document.createElement('div');
    editClientModal.id = 'edit-client-modal';
    editClientModal.style.display = 'none';
    editClientModal.innerHTML = `
        <div class="modal-backdrop"></div>
        <div class="modal-content">
            <h3>Editar Cliente</h3>
            <form id="edit-client-form" class="edit-form">
                <div class="form-group">
                    <label>Nombre</label>
                    <input type="text" id="edit-client-name" class="form-control" required />
                </div>
                <div class="form-group">
                    <label>Teléfono</label>
                    <input type="text" id="edit-client-phone" class="form-control" required />
                </div>
                <div class="form-group">
                    <label>Placa</label>
                    <input type="text" id="edit-client-plate" class="form-control" required />
                </div>
                <div class="form-group">
                    <label>Tipo de Vehículo</label>
                    <select id="edit-vehicle-type" class="form-control" required>
                        <option value="">Seleccione...</option>
                        <option value="car">Automóvil</option>
                        <option value="motorcycle">Motocicleta</option>
                        <option value="bicycle">Bicicleta</option>
                        <option value="truck">Vehículo Pesado</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Plan de Pago</label>
                    <select id="edit-payment-plan" class="form-control" required>
                        <option value="">Seleccione...</option>
                        <option value="mensual">Mensual</option>
                        <option value="diario">Diario</option>
                        <option value="hora">Por Hora</option>
                    </select>
                </div>
                <div class="modal-actions">
                    <button type="submit" class="action-button primary">Guardar</button>
                    <button type="button" id="cancel-edit-client" class="action-button danger">Cancelar</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(editClientModal);

    let editingClientId = null;

    function showEditClientModal(client) {
        document.getElementById('edit-client-name').value = client.name;
        document.getElementById('edit-client-phone').value = client.phone;
        document.getElementById('edit-client-plate').value = client.plate;
        document.getElementById('edit-vehicle-type').value = client.type;
        document.getElementById('edit-payment-plan').value = client.plan;
        editClientModal.style.display = 'flex';
    }

    function hideEditClientModal() {
        editClientModal.style.display = 'none';
        editingClientId = null;
    }

    // ----- Clientes -----
    newUserBtn.addEventListener("click", () => {
        userFormContainer.classList.remove("hidden");
        clientForm.reset();
        document.getElementById("client-id").value = "";
    });

    cancelUserBtn.addEventListener("click", () => {
        userFormContainer.classList.add("hidden");
        clientForm.reset();
    });

    clientForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const clientId = document.getElementById("client-id").value;
        const name = document.getElementById("client-name").value.trim();
        const phone = document.getElementById("client-phone").value.trim();
        const plate = document.getElementById("client-vehicle").value.trim().toUpperCase();
        const type = document.getElementById("vehicle-type").value;
        const plan = document.getElementById("payment-plan").value;
        const typeText = document.getElementById("vehicle-type").selectedOptions[0].text;
        const planText = document.getElementById("payment-plan").selectedOptions[0].text;

        const client = { id: clientId || generateId(), name, phone, plate, type, plan, typeText, planText };

        if (clientId) {
            updateClientInTable(client);
            updateClientInLocalStorage(client);
        } else {
            addClientToTable(client);
            saveClientToLocalStorage(client);
        }

        clientForm.reset();
        userFormContainer.classList.add("hidden");
    });

    function generateId() {
        return Math.random().toString(36).substring(2, 15);
    }

    function addClientToTable(client) {
        const row = document.createElement("tr");
        row.dataset.clientId = client.id;
        row.innerHTML = `
            <td data-cell="name">${client.name}</td>
            <td data-cell="contact">${client.phone}</td>
            <td data-cell="vehicle">${client.plate}</td>
            <td data-cell="type">${client.typeText}</td>
            <td data-cell="plan">${client.planText}</td>
            <td class="actions-col">
                <button class="action-button small edit-btn primary" data-id="${client.id}">
                    <i class="fas fa-edit"></i>
                    <span>Editar</span>
                </button>
                <button class="action-button small danger delete-btn" data-id="${client.id}">
                    <i class="fas fa-trash"></i>
                    <span>Eliminar</span>
                </button>
            </td>
        `;
        clientsTableBody.appendChild(row);
        addClientRowEventListeners(row);
    }

    function updateClientInTable(client) {
        const row = clientsTableBody.querySelector(`tr[data-client-id="${client.id}"]`);
        if (row) {
            row.querySelector('[data-cell="name"]').textContent = client.name;
            row.querySelector('[data-cell="contact"]').textContent = client.phone;
            row.querySelector('[data-cell="vehicle"]').textContent = client.plate;
            row.querySelector('[data-cell="type"]').textContent = client.typeText;
            row.querySelector('[data-cell="plan"]').textContent = client.planText;
        }
    }

    function saveClientToLocalStorage(client) {
        const clients = JSON.parse(localStorage.getItem("clients")) || [];
        clients.push(client);
        localStorage.setItem("clients", JSON.stringify(clients));
    }

    function updateClientInLocalStorage(updatedClient) {
        const clients = JSON.parse(localStorage.getItem("clients")) || [];
        const updatedClients = clients.map(client =>
            client.id === updatedClient.id ? updatedClient : client
        );
        localStorage.setItem("clients", JSON.stringify(updatedClients));
    }

    function loadClientsFromLocalStorage() {
        const clients = JSON.parse(localStorage.getItem("clients")) || [];
        clients.forEach(client => addClientToTable(client));
    }

    function deleteClientFromLocalStorage(clientId) {
        const clients = JSON.parse(localStorage.getItem("clients")) || [];
        const updatedClients = clients.filter(client => client.id !== clientId);
        localStorage.setItem("clients", JSON.stringify(updatedClients));
    }

    function addClientRowEventListeners(row) {
        const editBtn = row.querySelector(".edit-btn");
        const deleteBtn = row.querySelector(".delete-btn");

        // Nuevo: abrir modal flotante al editar
        editBtn.addEventListener("click", () => {
            const clientId = editBtn.dataset.id;
            const clients = JSON.parse(localStorage.getItem("clients")) || [];
            const clientToEdit = clients.find(client => client.id === clientId);
            if (clientToEdit) {
                editingClientId = clientId;
                showEditClientModal(clientToEdit);
            }
        });

        deleteBtn.addEventListener("click", () => {
            const clientId = deleteBtn.dataset.id;
            if (confirm("¿Seguro que desea eliminar este cliente?")) {
                deleteClientFromLocalStorage(clientId);
                row.remove();
            }
        });
    }

    // Guardar cambios desde el modal flotante
    document.getElementById('edit-client-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('edit-client-name').value.trim();
        const phone = document.getElementById('edit-client-phone').value.trim();
        const plate = document.getElementById('edit-client-plate').value.trim().toUpperCase();
        const type = document.getElementById('edit-vehicle-type').value;
        const plan = document.getElementById('edit-payment-plan').value;

        if (!name || !phone || !plate || !type || !plan) {
            alert("Todos los campos son obligatorios.");
            return;
        }

        let clients = JSON.parse(localStorage.getItem("clients")) || [];
        const idx = clients.findIndex(c => c.id === editingClientId);
        if (idx === -1) return;

        const typeText = document.querySelector(`#edit-vehicle-type option[value="${type}"]`).textContent;
        const planText = document.querySelector(`#edit-payment-plan option[value="${plan}"]`).textContent;

        clients[idx].name = name;
        clients[idx].phone = phone;
        clients[idx].plate = plate;
        clients[idx].type = type;
        clients[idx].plan = plan;
        clients[idx].typeText = typeText;
        clients[idx].planText = planText;

        localStorage.setItem("clients", JSON.stringify(clients));

        // Actualizar la tabla visualmente
        const row = clientsTableBody.querySelector(`tr[data-client-id="${editingClientId}"]`);
        if (row) {
            row.querySelector('[data-cell="name"]').textContent = name;
            row.querySelector('[data-cell="contact"]').textContent = phone;
            row.querySelector('[data-cell="vehicle"]').textContent = plate;
            row.querySelector('[data-cell="type"]').textContent = typeText;
            row.querySelector('[data-cell="plan"]').textContent = planText;
        }

        hideEditClientModal();
        alert("Cliente actualizado correctamente.");
    });

    // Cancelar edición
    document.getElementById('cancel-edit-client').addEventListener('click', hideEditClientModal);

    // Cerrar modal al hacer click fuera del contenido
    editClientModal.querySelector('.modal-backdrop').addEventListener('click', hideEditClientModal);

    // ----- Espacios -----
    spaceForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const typeValue = spaceTypeSelect.value;
        if (!typeValue) return;

        const typeMap = {
            car: "Automóvil",
            motorcycle: "Motocicleta",
            bicycle: "Bicicleta",
            truck: "Vehículo Pesado"
        };

        const id = `${typeValue.charAt(0).toUpperCase()}${Math.floor(Math.random() * 1000)}`;
        const newSpace = {
            id,
            type: typeValue,
            typeName: typeMap[typeValue],
            status: "available"
        };

        addSpaceToGrid(newSpace);
        saveSpaceToLocalStorage(newSpace);

        total++;
        updateSpaceSummary();
        spaceForm.reset();
    });

    function addSpaceToGrid(space) {
        const spaceDiv = document.createElement("div");
        spaceDiv.classList.add("parking-space");
        spaceDiv.dataset.type = space.type;
        spaceDiv.dataset.status = space.status;
        spaceDiv.dataset.spaceId = space.id;
        spaceDiv.innerHTML = `
            <span class="space-id">${space.id}</span>
            <span class="space-type">${space.typeName}</span>
            <span class="space-status" data-status="${space.status}">${space.status === "available" ? "Disponible" : "Ocupado"}</span>
        `;
        parkingGrid.appendChild(spaceDiv);
    }

    function saveSpaceToLocalStorage(space) {
        const spaces = JSON.parse(localStorage.getItem("spaces")) || [];
        spaces.push(space);
        localStorage.setItem("spaces", JSON.stringify(spaces));
    }

    function loadSpacesFromLocalStorage() {
        const spaces = JSON.parse(localStorage.getItem("spaces")) || [];
        parkingGrid.innerHTML = "";
        total = spaces.length;
        spaces.forEach(space => addSpaceToGrid(space));
        updateSpaceSummary();
    }

    function updateSpaceSummary() {
        const disponibles = document.querySelectorAll('.parking-space[data-status="available"]').length;
        availableSpaces.textContent = `${disponibles} disponibles`;
        totalSpaces.textContent = `de ${total} totales`;
    }

    // ----- Inicialización -----
    loadClientsFromLocalStorage();
    loadSpacesFromLocalStorage();
});
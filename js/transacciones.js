document.addEventListener("DOMContentLoaded", () => {
    // --- Elementos del DOM ---
    const vehiclePaymentInfo = document.getElementById("vehicle-payment-info");
    const infoPlate = document.getElementById("info-plate");
    const infoTime = document.getElementById("info-time");
    const infoRate = document.getElementById("info-rate");
    const transactionForm = document.getElementById("transaction-form");
    const transactionAmountInput = document.getElementById("transaction-amount");
    const paymentMethodSelect = document.getElementById("payment-method");
    const transactionsTableBody = document.querySelector("#transactions-table tbody");
    const filterTabs = document.querySelectorAll(".filter-tab");
    const vehicleInput = document.getElementById("vehicle-to-pay");
    const vehicleDatalist = document.getElementById("vehicle-plates-list");

    let currentVehicle = null;
    let currentFilter = 'all';
    let editingTransactionId = null;

    // =====================
    // Modal de Edición
    // =====================
    // Crear modal dinámicamente
    let editModal = document.createElement('div');
    editModal.id = 'edit-transaction-modal';
    editModal.style.display = 'none';
    editModal.innerHTML = `
        <div class="modal-backdrop"></div>
        <div class="modal-content">
            <h3>Actualizar Transacción</h3>
            <form id="edit-transaction-form" class="edit-form">
                <div class="form-group">
                    <label>Placa</label>
                    <input type="text" id="edit-plate" disabled class="form-control" />
                </div>
                <div class="form-group">
                    <label>Fecha</label>
                    <input type="text" id="edit-date" disabled class="form-control" />
                </div>
                <div class="form-group">
                    <label>Monto</label>
                    <input type="number" id="edit-amount" min="1" class="form-control" required />
                </div>
                <div class="form-group">
                    <label>Método de Pago</label>
                    <select id="edit-method" class="form-control" required>
                        <option value="">Seleccione...</option>
                        <option value="Efectivo">Efectivo</option>
                        <option value="Tarjeta">Tarjeta</option>
                        <option value="Transferencia">Transferencia</option>
                    </select>
                </div>
                <div class="modal-actions">
                    <button type="submit" class="action-button primary">Guardar</button>
                    <button type="button" id="cancel-edit" class="action-button danger">Cancelar</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(editModal);

    function showEditModal(transaction) {
        document.getElementById('edit-plate').value = transaction.plate;
        document.getElementById('edit-date').value = formatDate(transaction.date);
        document.getElementById('edit-amount').value = transaction.amount || '';
        document.getElementById('edit-method').value = transaction.paymentMethod || '';
        document.getElementById('edit-amount').disabled = false;
        document.getElementById('edit-method').disabled = false;
        // Si está completada, solo permite ver los datos
        if (transaction.status === 'completed') {
            document.getElementById('edit-amount').disabled = false;
            document.getElementById('edit-method').disabled = false;
        }
        editModal.style.display = 'flex';
    }

    function hideEditModal() {
        editModal.style.display = 'none';
        editingTransactionId = null;
    }

    // =====================
    // Funciones Auxiliares
    // =====================

    function formatDate(date) {
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(date).toLocaleDateString('es-CO', options);
    }

    function saveTransaction(transaction) {
        const transactions = JSON.parse(localStorage.getItem("transactions")) || [];
        transactions.unshift(transaction);
        localStorage.setItem("transactions", JSON.stringify(transactions));
        loadTransactions(currentFilter);
    }

    function loadTransactions(filter = 'all') {
        currentFilter = filter;
        transactionsTableBody.innerHTML = "";
        const transactions = JSON.parse(localStorage.getItem("transactions")) || [];
        transactions.forEach(transaction => {
            if (filter === 'all' || transaction.status === filter) {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td data-cell="date">${formatDate(transaction.date)}</td>
                    <td data-cell="plate">${transaction.plate}</td>
                    <td data-cell="client">${transaction.clientName || 'N/A'}</td>
                    <td data-cell="amount">${transaction.amount ? '$' + transaction.amount.toLocaleString('es-CO') : 'Pendiente'}</td>
                    <td data-cell="status" class="${transaction.status}">${transaction.status === 'completed' ? 'Completado' : 'Pendiente'}</td>
                    <td data-cell="method">${transaction.paymentMethod || '-'}</td>
                    <td data-cell="actions" class="text-right">
                        <button class="action-button small primary edit-transaction" data-id="${transaction.id}" title="Actualizar">
                            <i class="fas fa-edit"></i> Actualizar
                        </button>
                        <button class="action-button small danger delete-transaction" data-id="${transaction.id}">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </td>
                `;
                transactionsTableBody.appendChild(row);
            }
        });

        // Asignar eventos a los botones de eliminar y actualizar
        document.querySelectorAll(".delete-transaction").forEach(btn => {
            btn.addEventListener("click", () => {
                if (confirm("¿Seguro que desea eliminar esta transacción?")) {
                    deleteTransaction(btn.dataset.id);
                }
            });
        });

        document.querySelectorAll(".edit-transaction").forEach(btn => {
            btn.addEventListener("click", () => {
                editTransaction(btn.dataset.id);
            });
        });
    }

    function deleteTransaction(id) {
        let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
        transactions = transactions.filter(t => t.id !== id);
        localStorage.setItem("transactions", JSON.stringify(transactions));
        loadTransactions(currentFilter);
    }

    function editTransaction(id) {
        const transactions = JSON.parse(localStorage.getItem("transactions")) || [];
        const transaction = transactions.find(t => t.id === id);
        if (!transaction) return;
        editingTransactionId = id;
        showEditModal(transaction);
    }

    function getClientNameByPlate(plate) {
        const clients = JSON.parse(localStorage.getItem("clients")) || [];
        const client = clients.find(c => c.plate === plate);
        return client ? client.name : null;
    }

    function loadVehiclesInParking() {
        const vehiclesInParking = JSON.parse(localStorage.getItem("vehiculos")) || [];
        vehicleDatalist.innerHTML = "";
        vehiclesInParking.forEach(vehicle => {
            const option = document.createElement("option");
            option.value = vehicle.placa;
            vehicleDatalist.appendChild(option);
        });
    }

    function calculateTimeAndFare(checkInTime) {
        const horaIngreso = new Date(checkInTime);
        if (isNaN(horaIngreso.getTime())) {
            return { timeElapsed: 'NaN', rate: '$3.000/hora', amount: NaN };
        }
        const ahora = new Date();
        const diffHoras = Math.max(1, Math.ceil((ahora - horaIngreso) / (1000 * 60 * 60)));
        const tarifaPorHora = 3000;
        const montoTotal = diffHoras * tarifaPorHora;
        return {
            timeElapsed: `${diffHoras} hora(s)`,
            rate: `$${tarifaPorHora.toLocaleString('es-CO')}/hora`,
            amount: montoTotal
        };
    }

    // =====================
    // Eventos
    // =====================

    // Selección de vehículo (input + datalist)
    vehicleInput.addEventListener("input", () => {
        const enteredPlate = vehicleInput.value.trim().toUpperCase();
        if (enteredPlate) {
            const vehiclesInParking = JSON.parse(localStorage.getItem("vehiculos")) || [];
            const selectedVehicleData = vehiclesInParking.find(v => v.placa === enteredPlate);

            if (selectedVehicleData) {
                const paymentDetails = calculateTimeAndFare(selectedVehicleData.horaIngreso);
                currentVehicle = {
                    plate: selectedVehicleData.placa,
                    ...paymentDetails,
                    clientName: getClientNameByPlate(selectedVehicleData.placa)
                };
                infoPlate.textContent = currentVehicle.plate;
                infoTime.textContent = currentVehicle.timeElapsed;
                infoRate.textContent = currentVehicle.rate;
                transactionAmountInput.value = currentVehicle.amount;
                vehiclePaymentInfo.style.display = 'block';
            } else {
                vehiclePaymentInfo.style.display = 'none';
                currentVehicle = null;
            }
        } else {
            vehiclePaymentInfo.style.display = 'none';
            currentVehicle = null;
        }
    });

    // Procesar pago
    transactionForm.addEventListener("submit", (e) => {
        e.preventDefault();

        if (!currentVehicle) {
            alert("Por favor, seleccione un vehículo para procesar el pago.");
            return;
        }

        const amount = parseFloat(transactionAmountInput.value);
        const paymentMethod = paymentMethodSelect.value;

        if (isNaN(amount) || amount <= 0) {
            alert("El importe ingresado no es válido. Por favor, verifique.");
            return;
        }
        if (!paymentMethod) {
            alert("Por favor, seleccione un método de pago.");
            return;
        }

        let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

        // Buscar transacción pendiente y actualizarla
        const pendingIndex = transactions.findIndex(
            t => t.plate === currentVehicle.plate && t.status === "pending"
        );

        if (pendingIndex > -1) {
            transactions[pendingIndex] = {
                ...transactions[pendingIndex],
                date: new Date().toISOString(),
                clientName: currentVehicle.clientName,
                amount: amount,
                paymentMethod: paymentMethod,
                status: "completed"
            };
            localStorage.setItem("transactions", JSON.stringify(transactions));
            loadTransactions(currentFilter);
        } else {
            // Si no existe, crea una nueva transacción completada
            const transactionId = Math.random().toString(36).substring(2, 15);
            const newTransaction = {
                id: transactionId,
                date: new Date().toISOString(),
                plate: currentVehicle.plate,
                clientName: currentVehicle.clientName,
                amount: amount,
                paymentMethod: paymentMethod,
                status: 'completed'
            };
            saveTransaction(newTransaction);
        }

        transactionForm.reset();
        vehiclePaymentInfo.style.display = 'none';
        currentVehicle = null;
        loadVehiclesInParking();
    });

    // Evento para guardar edición
    document.getElementById('edit-transaction-form').addEventListener('submit', function (e) {
        e.preventDefault();
        const amount = parseFloat(document.getElementById('edit-amount').value);
        const method = document.getElementById('edit-method').value;

        if (isNaN(amount) || amount <= 0) {
            alert("El monto debe ser un número positivo.");
            return;
        }
        if (!method) {
            alert("Seleccione un método de pago.");
            return;
        }

        let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
        const idx = transactions.findIndex(t => t.id === editingTransactionId);
        if (idx === -1) return;

        // Si estaba pendiente, actualizar fecha y estado
        if (transactions[idx].status === "pending") {
            transactions[idx].date = new Date().toISOString();
            transactions[idx].status = "completed";
        }
        transactions[idx].amount = amount;
        transactions[idx].paymentMethod = method;

        localStorage.setItem("transactions", JSON.stringify(transactions));
        hideEditModal();
        loadTransactions(currentFilter);
        // Feedback visual
        alert("Transacción actualizada correctamente.");
    });

    // Cancelar edición
    document.getElementById('cancel-edit').addEventListener('click', function () {
        hideEditModal();
    });

    // Cerrar modal al hacer click fuera del contenido
    editModal.querySelector('.modal-backdrop').addEventListener('click', hideEditModal);

    // Filtrado del historial
    filterTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            filterTabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            loadTransactions(tab.dataset.filter);
        });
    });

    // =====================
    // Inicialización
    // =====================
    loadTransactions();
    loadVehiclesInParking();
});
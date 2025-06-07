document.addEventListener("DOMContentLoaded", () => {
    const queryForm = document.getElementById("vehicle-query");
    const vehiclePlateInput = document.getElementById("vehicle-plate");
    const queryResultsSection = document.getElementById("query-results");
    const vehicleDetailsDiv = document.getElementById("vehicle-details");
    const checkoutButton = document.getElementById("checkout-action");

    const checkinForm = document.getElementById("checkin-form");
    const checkinPlateInput = document.getElementById("checkin-plate");
    const parkingSlotSelect = document.getElementById("parking-slot");

    const currentVehiclesTableBody = document.querySelector("#current-vehicles tbody");
    const refreshListBtn = document.getElementById("refresh-list");

    // ----- Espacios -----
    function populateParkingSlotSelect(availableSpacesList) {
        parkingSlotSelect.innerHTML = '<option value="" disabled selected>Seleccione espacio</option>';
        availableSpacesList.forEach(space => {
            const option = document.createElement("option");
            option.value = space.id;
            option.textContent = space.id;
            parkingSlotSelect.appendChild(option);
        });
    }

    function getAvailableSpacesFromLocalStorage() {
        const spaces = JSON.parse(localStorage.getItem("spaces")) || [];
        return spaces.filter(space => space.status === "available");
    }

    function updateSpaceStatus(spaceId, newStatus) {
        const spaces = JSON.parse(localStorage.getItem("spaces")) || [];
        const updatedSpaces = spaces.map(space =>
            space.id === spaceId ? { ...space, status: newStatus } : space
        );
        localStorage.setItem("spaces", JSON.stringify(updatedSpaces));
        loadCurrentVehicles();
        populateParkingSlotSelect(getAvailableSpacesFromLocalStorage());
    }

    // ----- Consulta de Vehículos -----
    queryForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const placa = vehiclePlateInput.value.trim().toUpperCase();

        if (!placa) {
            alert("Por favor, ingrese una placa.");
            return;
        }

        const vehiculos = JSON.parse(localStorage.getItem("vehiculos")) || [];
        const vehiculo = vehiculos.find(v => v.placa === placa);

        if (vehiculo) {
            const spaces = JSON.parse(localStorage.getItem("spaces")) || [];
            const espacioInfo = spaces.find(s => s.id === vehiculo.espacio);
            const espacioNombre = espacioInfo ? espacioInfo.id : "No asignado";

            vehicleDetailsDiv.innerHTML = `
                <p><strong>Placa:</strong> ${vehiculo.placa}</p>
                <p><strong>Ubicación:</strong> ${espacioNombre}</p>
                <p><strong>Hora de Ingreso:</strong> ${vehiculo.horaIngreso}</p>
            `;
            queryResultsSection.classList.remove("hidden");
        } else {
            alert("No se encontró ningún vehículo con esa placa.");
            queryResultsSection.classList.add("hidden");
            vehicleDetailsDiv.innerHTML = "";
        }
    });

    // ----- Retiro de Vehículo (solo si ya pagó) -----
    checkoutButton.addEventListener("click", () => {
        const placaConsulta = vehiclePlateInput.value.trim().toUpperCase();
        if (!placaConsulta) {
            alert("Por favor, ingrese la placa del vehículo a retirar.");
            return;
        }

        // Validar si el vehículo ya fue pagado
        const transactions = JSON.parse(localStorage.getItem("transactions")) || [];
        const pagoRealizado = transactions.some(t => t.plate === placaConsulta && t.status === "completed");
        if (!pagoRealizado) {
            alert("Debe realizar el pago antes de retirar el vehículo.");
            return;
        }

        const vehiculos = JSON.parse(localStorage.getItem("vehiculos")) || [];
        const vehiculoIndex = vehiculos.findIndex(v => v.placa === placaConsulta);

        if (vehiculoIndex > -1) {
            const vehiculo = vehiculos[vehiculoIndex];
            if (confirm(`¿Confirmar la salida del vehículo con placa ${vehiculo.placa} del espacio ${vehiculo.espacio}?`)) {
                updateSpaceStatus(vehiculo.espacio, "available");
                vehiculos.splice(vehiculoIndex, 1);
                localStorage.setItem("vehiculos", JSON.stringify(vehiculos));
                alert(`Salida del vehículo ${vehiculo.placa} registrada.`);
                queryResultsSection.classList.add("hidden");
                vehicleDetailsDiv.innerHTML = "";
                vehiclePlateInput.value = "";
                loadCurrentVehicles();
            }
        } else {
            alert("No se encontró ningún vehículo con esa placa para realizar la salida.");
        }
    });

    // ----- Registro de Ingreso (Check-in) -----
    checkinForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const placa = checkinPlateInput.value.trim().toUpperCase();
        const espacio = parkingSlotSelect.value;

        if (!placa || !espacio) {
            alert("Por favor, complete la placa y seleccione un espacio.");
            return;
        }

        const vehiculos = JSON.parse(localStorage.getItem("vehiculos")) || [];
        const espacioOcupado = vehiculos.find(v => v.espacio === espacio);
        if (espacioOcupado) {
            alert(`El espacio ${espacio} ya está ocupado por el vehículo con placa ${espacioOcupado.placa}.`);
            return;
        }

        const horaIngreso = new Date().toISOString();

        const nuevoVehiculo = {
            placa,
            espacio,
            horaIngreso
        };

        vehiculos.push(nuevoVehiculo);
        localStorage.setItem("vehiculos", JSON.stringify(vehiculos));

        // Crear transacción pendiente
        const transactions = JSON.parse(localStorage.getItem("transactions")) || [];
        transactions.unshift({
            id: Math.random().toString(36).substring(2, 15),
            date: horaIngreso,
            plate: placa,
            clientName: null,
            amount: null,
            paymentMethod: null,
            notes: "",
            status: "pending"
        });
        localStorage.setItem("transactions", JSON.stringify(transactions));

        updateSpaceStatus(espacio, "occupied");

        alert(`Ingreso del vehículo ${placa} al espacio ${espacio} registrado.`);
        checkinForm.reset();
        loadCurrentVehicles();
        populateParkingSlotSelect(getAvailableSpacesFromLocalStorage());
    });

    // ----- Listado de Vehículos -----
    function loadCurrentVehicles() {
        const vehiculos = JSON.parse(localStorage.getItem("vehiculos")) || [];
        currentVehiclesTableBody.innerHTML = "";

        vehiculos.forEach(v => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${v.placa}</td>
                <td>${v.espacio}</td>
                <td>${v.horaIngreso}</td>
                <td class="actions-column">
                    <button class="action-button small delete-btn" data-plate="${v.placa}">Retirar</button>
                </td>
            `;
            currentVehiclesTableBody.appendChild(tr);
        });

        // Botones de "Retirar" en la tabla
        const retirarButtons = currentVehiclesTableBody.querySelectorAll(".delete-btn");
        retirarButtons.forEach(button => {
            button.addEventListener("click", () => {
                const placaToRemove = button.dataset.plate;
                // Validar pago antes de retirar
                const transactions = JSON.parse(localStorage.getItem("transactions")) || [];
                const pagoRealizado = transactions.some(t => t.plate === placaToRemove && t.status === "completed");
                if (!pagoRealizado) {
                    alert("Debe realizar el pago antes de retirar el vehículo.");
                    return;
                }
                const vehiculos = JSON.parse(localStorage.getItem("vehiculos")) || [];
                const vehiculoToRemove = vehiculos.find(v => v.placa === placaToRemove);

                if (vehiculoToRemove) {
                    if (confirm(`¿Confirmar la salida del vehículo con placa ${placaToRemove} del espacio ${vehiculoToRemove.espacio}?`)) {
                        updateSpaceStatus(vehiculoToRemove.espacio, "available");
                        const updatedVehiculos = vehiculos.filter(v => v.placa !== placaToRemove);
                        localStorage.setItem("vehiculos", JSON.stringify(updatedVehiculos));
                        alert(`Salida del vehículo ${placaToRemove} registrada.`);
                        loadCurrentVehicles();
                        populateParkingSlotSelect(getAvailableSpacesFromLocalStorage());
                    }
                }
            });
        });
    }

    refreshListBtn.addEventListener("click", loadCurrentVehicles);

    // ----- Inicialización -----
    populateParkingSlotSelect(getAvailableSpacesFromLocalStorage());
    loadCurrentVehicles();
});
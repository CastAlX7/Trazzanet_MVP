document.addEventListener('DOMContentLoaded', () => {
    // --- CREDENCIALES PRE-ESTABLECIDAS (Hardcoded) ---
    const CREDENCIALES = {
        ruc: "20601234567",      // RUC de la empresa
        usuario: "admin",        // Usuario Super Admin
        pass: "avocado123"       // Contraseña
    };

    const loginForm = document.getElementById('login-form');
    const rucInput = document.getElementById('input-ruc');
    const errorMsg = document.getElementById('error-msg');

    // 1. Filtro visual: Solo permitir números en el campo RUC
    rucInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });

    // 2. Manejar el evento de "Ingresar"
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const rucIngresado = rucInput.value;
        const userIngresado = document.getElementById('input-user').value;
        const passIngresado = document.getElementById('input-pass').value;

        // --- VALIDACIÓN ESTRICTA ---
        
        // Comparamos lo que escribió el usuario con las constantes de arriba
        if (rucIngresado === CREDENCIALES.ruc && 
            userIngresado === CREDENCIALES.usuario && 
            passIngresado === CREDENCIALES.pass) {
            
            // 1. Guardar sesión simulada
            localStorage.setItem('avocadoSession', JSON.stringify({
                isLoggedIn: true,
                empresaRuc: rucIngresado,
                usuario: userIngresado,
                rol: 'SuperAdmin'
            }));

            // 2. Efecto visual de carga en el botón
            const btn = loginForm.querySelector('button');
            const textoOriginal = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Iniciando...';
            btn.disabled = true; // Evitar doble click
            
            // 3. REDIRECCIÓN A USUARIOS.HTML
            setTimeout(() => {
                window.location.href = 'usuarios.html'; 
            }, 1000); // 1 segundo de espera dramática

        } else {
            // Si algo no coincide, mostramos error
            mostrarError("Credenciales incorrectas. Verifica RUC, usuario o contraseña.");
        }
    });

    function mostrarError(mensaje) {
        errorMsg.classList.remove('hidden');
        errorMsg.querySelector('span').innerText = mensaje;
        
        // Sacudir el formulario (efecto visual opcional con Tailwind no es nativo, pero el mensaje basta)
        setTimeout(() => {
            errorMsg.classList.add('hidden');
        }, 3000);
    }
});
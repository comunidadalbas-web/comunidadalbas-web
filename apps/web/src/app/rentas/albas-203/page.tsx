export default function Albas203Page() {
  return (
    <main className="min-h-screen bg-background font-sans antialiased">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 mb-4">
            Departamento equipado en Real Granada · Privada Albas
          </h1>
          <p className="text-2xl sm:text-3xl lg:text-4xl text-gray-600 mb-8">
            Renta $8,500 MXN / mes
          </p>
        </div>

        <div className="grid max-w-10xl mx-auto grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="p-4 sm:p-6 bg-white rounded-lg shadow-sm border">
            <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">67.04 m²</div>
            <div className="text-sm text-gray-500">Superficie total</div>
          </div>

          <div className="p-4 sm:p-6 bg-white rounded-lg shadow-sm border">
            <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">3 Recámaras</div>
            <div className="text-sm text-gray-500">Recámaras</div>
          </div>

          <div className="p-4 sm:p-6 bg-white rounded-lg shadow-sm border">
            <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">1 Baño</div>
            <div className="text-sm text-gray-500">Baño completo</div>
          </div>

          <div className="p-4 sm:p-6 bg-white rounded-lg shadow-sm border">
            <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Cajón 203</div>
            <div className="text-sm text-gray-500">Estacionamiento exclusivo</div>
          </div>
        </div>

        <div className="mt-12 pt-12 border-t">
          <h2 className="text-xl sm:text-2xl font-medium text-gray-600 mb-6 border-b pb-4">Lo que incluye</h2>
          <ul className="space-y-2 text-left max-w-2xl mx-auto">
            <li className="flex items-start text-sm text-gray-700">
              <svg
                className="flex-shrink-0 w-4 h-4 text-green-500 mr-2"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M20 6L9 17l-5-5L2 6h10v2H2V6z" />
              </svg>
              Cocina integral
            </li>
            <li className="flex items-start text-sm text-gray-700">
              <svg
                className="flex-shrink-0 w-4 h-4 text-green-500 mr-2"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <path d="M14 8v6l-5.5-3.5z" />
              </svg>
              Refrigerador
            </li>
            <li className="flex items-start text-sm text-gray-700">
              <svg
                className="flex-shrink-0 w-4 h-4 text-green-500 mr-2"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2L2 7l10 5 5-10-10-5z" />
              </svg>
              Lavasecadora
            </li>
            <li className="flex items-start text-sm text-gray-700">
              <svg
                className="flex-shrink-0 w-4 h-4 text-green-500 mr-2"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 22h8v-2h-8v-2zm0-6h8v-2h-8v-2zm0-6v2h8l8-8h-8l-8 8z" />
              </svg>
              Tanque estacionario
            </li>
            <li className="flex items-start text-sm text-gray-700">
              <svg
                className="flex-shrink-0 w-4 h-4 text-green-500 mr-2"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 3l4h4v14h-4l-4-4zm0 14l4-4h8v-2h-8v2z" />
              </svg>
              Calentador
            </li>
            <li className="flex items-start text-sm text-gray-700">
              <svg
                className="flex-shrink-0 w-4 h-4 text-green-500 mr-2"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M21 11.5a8.38 8.38 0 0 1-2.09-2.05l.95-2.12a1 1 0 0 0-.3-1.04l-1.63-.83a1 1 0 0 0-1.02-.35 1 1 0 0 0-.3.95l.81 2.12A8.38 8.38 0 0 1 21 11.5z" />
              </svg>
              Administración incluida
            </li>
          </ul>
        </div>

        <div className="mt-6 text-sm text-gray-500">
          CFE y agua a cargo del arrendatario
        </div>

        <div className="mt-16 sm:mt-20">
          <div className="max-w-4xl mx-auto">
            <a
              href="/contacto"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-medium rounded-lg hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Solicitar información
            </a>
            <a
              href="#"
              className="mt-4 inline-flex items-center justify-center gap-2 px-6 py-3 sm:px-8 sm:py-4 text-indigo-600 font-medium rounded-lg hover:bg-indigo-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Iniciar proceso de arrendamiento
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
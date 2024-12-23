import { Link } from 'react-router-dom'

const Home = () => {
  return (
    <div className="bg-transparent">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="relative px-4 py-12 sm:px-6 sm:py-24 lg:py-32 lg:px-8">
          <div className="text-center max-w-7xl mx-auto">
            <h1 className="mt-1 text-3xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl fade-in-up">
              <span className="block text-4xl sm:text-6xl md:text-7xl mb-2 sm:mb-3">Snuli-hub</span>
              <span className="block text-primary-600 text-2xl sm:text-4xl md:text-5xl">Experience Pure Soy Goodness</span>
            </h1>
            <p className="mt-4 sm:mt-8 mx-auto text-base sm:text-xl text-gray-500 px-4 sm:px-6 max-w-lg sm:max-w-3xl fade-in-up stagger-delay-1">
              Discover our premium soy drink powder, crafted with care to bring you the perfect blend of nutrition and taste.
            </p>
            <div className="mt-6 sm:mt-10 px-4 sm:px-6 max-w-sm mx-auto sm:max-w-none sm:flex sm:justify-center fade-in-up stagger-delay-2">
              <div className="w-full sm:w-auto">
                <Link
                  to="/store"
                  className="w-full flex items-center justify-center px-6 sm:px-8 py-2.5 sm:py-3 border border-transparent text-sm sm:text-base font-medium rounded-full text-white bg-primary-600 hover:bg-primary-700 md:py-4 md:text-lg md:px-10 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  Shop Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-12 sm:py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:gap-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            <div className="space-y-3 sm:space-y-4 text-center">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary-100">
                <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900">Natural Ingredients</h3>
              <p className="text-sm sm:text-base text-gray-500 px-4 sm:px-0">Made from premium quality soybeans with no artificial additives.</p>
            </div>

            <div className="space-y-3 sm:space-y-4 text-center">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary-100">
                <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900">Rich in Protein</h3>
              <p className="text-sm sm:text-base text-gray-500 px-4 sm:px-0">High protein content to support your active lifestyle.</p>
            </div>

            <div className="space-y-3 sm:space-y-4 text-center sm:col-span-2 lg:col-span-1">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary-100">
                <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900">Easy to Prepare</h3>
              <p className="text-sm sm:text-base text-gray-500 px-4 sm:px-0">Simply mix with water for a delicious and nutritious drink.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home

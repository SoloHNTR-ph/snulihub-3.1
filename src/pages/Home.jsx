import { Link } from 'react-router-dom'

const Home = () => {
  return (
    <div className="bg-transparent">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* <div className="absolute inset-0">
          <img
            src="https://sewapoint.com/image-categories/image-1723429886178-soyabean.webp"
            alt="Background"
            className="w-full h-full object-cover"
          />
        </div> */}
        
        <div className="relative  py-24 sm:py-32 lg:px-8">
          <div className="text-center">
            <h1 className="mt-1 text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl fade-in-up">
              <span className="block text-5xl sm:text-6xl md:text-7xl mb-3">Snuli-hub</span>
              <span className="block text-primary-600 text-3xl sm:text-4xl md:text-5xl">Experience Pure Soy Goodness</span>
            </h1>
            <p className="mt-8 max-w-lg mx-auto text-xl text-gray-500 sm:max-w-3xl fade-in-up stagger-delay-1">
              Discover our premium soy drink powder, crafted with care to bring you the perfect blend of nutrition and taste.
            </p>
            <div className="mt-10 max-w-sm mx-auto sm:max-w-none sm:flex sm:justify-center fade-in-up stagger-delay-2">
              <div className="space-y-4 sm:space-y-0 sm:mx-auto">
                <Link
                  to="/store"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-full text-white bg-primary-600 hover:bg-primary-700 md:py-4 md:text-lg md:px-10 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  Shop Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-8">
            <div className="space-y-4 text-center">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary-100">
                <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Natural Ingredients</h3>
              <p className="text-base text-gray-500">Made from premium quality soybeans with no artificial additives.</p>
            </div>

            <div className="space-y-4 text-center">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary-100">
                <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Rich in Protein</h3>
              <p className="text-base text-gray-500">High protein content to support your active lifestyle.</p>
            </div>

            <div className="space-y-4 text-center">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary-100">
                <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Easy to Prepare</h3>
              <p className="text-base text-gray-500">Simply mix with water for a delicious and nutritious drink.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home

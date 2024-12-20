import { useNavigate } from 'react-router-dom';

const BuildingStorePage = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Store Under Construction
        </h1>
        <p className="text-gray-600 mb-8">
          Please set up your store name to continue
        </p>
        <button
          onClick={() => navigate('/franchise/dashboard')}
          className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
};

export default BuildingStorePage;

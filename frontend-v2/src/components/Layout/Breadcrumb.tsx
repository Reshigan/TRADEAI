import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 px-6 py-3 bg-gray-50 border-b">
      <Link to="/" className="hover:text-primary-600 flex items-center">
        <Home size={16} />
      </Link>
      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const displayName = name.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');

        return (
          <React.Fragment key={routeTo}>
            <ChevronRight size={16} className="text-gray-400" />
            {isLast ? (
              <span className="font-medium text-gray-900">{displayName}</span>
            ) : (
              <Link to={routeTo} className="hover:text-primary-600">
                {displayName}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

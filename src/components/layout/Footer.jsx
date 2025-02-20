import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const navigation = [
    { name: 'Get Fixed', href: '/get-fixed' },
    { name: 'Help Fix', href: '/help-fix' },
  ];

  return (
    <footer className="bg-indigo-600">
      <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center space-y-4 sm:flex-row sm:justify-between sm:space-y-0">
          <div className="flex flex-col items-center sm:items-start space-y-2">
            <Link to="/" className="text-white font-bold">
              FixMyHinge
            </Link>
            <p className="text-indigo-200 text-sm">
              an app by Ned
            </p>
          </div>

          <div className="flex space-x-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-indigo-200 hover:text-white text-sm"
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="text-indigo-200 text-sm">
            © {new Date().getFullYear()} FixMyHinge. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
} 
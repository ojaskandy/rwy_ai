import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface EarlyAccessSignup {
  id: number;
  fullName: string;
  email: string;
  referralSource: string;
  newsletterOptIn: boolean;
  createdAt: string;
}

interface SignupsResponse {
  count: number;
  signups: EarlyAccessSignup[];
}

export default function EarlyAccessAdmin() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-early-access'],
    queryFn: async (): Promise<SignupsResponse> => {
      const response = await apiRequest("GET", "/api/admin/early-access");
      if (!response.ok) {
        throw new Error("Failed to fetch signups");
      }
      return response.json();
    }
  });

  const downloadCSV = () => {
    if (!data?.signups) return;
    
    const headers = ['Name', 'Email', 'Newsletter Opt-in', 'Signup Date'];
    const csvContent = [
      headers.join(','),
      ...data.signups.map(signup => [
        `"${signup.fullName}"`,
        `"${signup.email}"`,
        signup.newsletterOptIn ? 'Yes' : 'No',
        `"${new Date(signup.createdAt).toLocaleDateString()}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `runway-ai-early-access-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading signups...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-red-600">
          Error loading signups. Please make sure you're authenticated.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Runway AI Early Access Signups
              </h1>
              <p className="text-gray-600 mt-2">
                Total signups: <span className="font-semibold">{data?.count || 0}</span>
              </p>
            </div>
            <button
              onClick={downloadCSV}
              className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Download CSV
            </button>
          </div>

          {data?.signups && data.signups.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-b">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-b">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-b">
                      Newsletter
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-b">
                      Signup Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.signups.map((signup, index) => (
                    <tr key={signup.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-sm text-gray-900 border-b">
                        {signup.fullName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 border-b">
                        <a 
                          href={`mailto:${signup.email}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {signup.email}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-sm border-b">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          signup.newsletterOptIn 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {signup.newsletterOptIn ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 border-b">
                        {new Date(signup.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">No signups yet</div>
              <p className="text-gray-400 mt-2">
                Early access signups will appear here once people start signing up.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
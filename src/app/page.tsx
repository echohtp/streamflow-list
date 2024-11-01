"use client";
import { useEffect, useState } from 'react';

interface Contract {
  id: number;
  address: string;
  cancelableBySender: boolean;
  closed: boolean;
}

const baseUrl = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";


export default function Home() {
  const [loading, setLoading] = useState(true);
  const [newContract, setNewContract] = useState('');
  const [data, setData] = useState<Contract[] | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchCheck() {
      try {
        const response = await fetch(`${baseUrl}/api/check`, {
          method: 'GET',
        });
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log('Fetched data:', data);
        setData(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching check:', error);
        setError(error as Error);
        setLoading(false);
      }
    }

    fetchCheck();
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    fetch(`${process.env.BASE_URL}/api/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address: newContract }),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      console.log('Posted data:', data);
    })
    .catch(error => {
      console.error('Error posting check:', error);
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="bg-gray-800 text-white p-6 rounded-lg shadow-lg">
          <table className="table-auto w-full text-left">
            <thead>
              <tr>
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Address</th>
                <th className="px-4 py-2">Cancelable By Sender</th>
                <th className="px-4 py-2">Closed</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((contract: Contract) => (
                <tr key={contract.id} className="bg-gray-700 border-b border-gray-600">
                  <td className="px-4 py-2">{contract.id}</td>
                  <td className="px-4 py-2">{contract.address}</td>
                  <td className="px-4 py-2">{contract.cancelableBySender ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-2">{contract.closed ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <form onSubmit={handleSubmit} className="mt-4">
            <input
              type="text"
              placeholder="Contract Address"
              value={newContract}
              onChange={(e) => setNewContract(e.target.value)}
              required
              className="bg-gray-700 text-white p-2 rounded-lg w-full mb-2"
            />
            <button type="submit" className="bg-blue-500 text-white p-2 rounded-lg w-full">Add Contract</button>
          </form>
        </div>
      )}
      {error && <p className="error text-red-500">{error.message}</p>}
    </div>
  );
}

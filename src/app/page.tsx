"use client";
import { useEffect, useState } from 'react';

interface Contract {
  created_at: string;
  created_at_unix: number;
  withdrawn_amount: string;
  end: number;
  last_withdrawn_at: number;
  address: string;
  start: number;
  deposited_amount: string;
  period: number;
  amount_per_period: string;
  cliff: number;
  cliff_amount: string;
  cancelable_by_sender: boolean;
  name: string;
  withdrawal_frequency: number;
  closed: boolean;
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);
  const [newContract, setNewContract] = useState('');
  const [data, setData] = useState<Contract[] | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchCheck() {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/check`, {
          method: 'GET',
        });
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log('Data:', data);
        setData(data.contracts);
        setLoading(false);
        setRefresh(false);
      } catch (error) {
        console.error('Error fetching check:', error);
        setError(error as Error);
        setLoading(false);
      }
    }

    console.log("fetching check");
    fetchCheck();
  }, [refresh]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!newContract) {
      console.error('Invalid contract address:', newContract);
      return;
    }
    const contract = newContract.split('/').pop();
    if (!contract) {
      console.error('Invalid contract address:', newContract);
      return;
    }
    
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/check`, {
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
        setRefresh(true);
      })
      .catch(error => {
        console.error('Error posting check:', error);
      });
  };

  return (
    <div className="min-h-screen bg-black text-green-500 p-6 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-6">Contract Management</h1>
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="loader ease-linear rounded-full border-8 border-t-8 border-green-500 h-32 w-32"></div>
          <p className="ml-4 text-2xl">Loading...</p>
        </div>
      ) : (
        <>
          <div className="bg-gray-900 text-green-500 p-6 rounded-lg shadow-lg w-full max-w-4xl mb-4">
            <p className="text-xl">
              Total: {data ? data.reduce((total, contract) => total + (Number(contract.deposited_amount) - Number(contract.withdrawn_amount)), 0) : 0}
            </p>
            <p className="text-xl">
              % of Supply: {data ? ((data.reduce((total, contract) => total + (Number(contract.deposited_amount) - Number(contract.withdrawn_amount)), 0) / 1_000_000_000_000_000) * 100).toFixed(2) : '0.000000'}%
            </p>
          </div>
          <div className="bg-gray-900 text-green-500 p-6 rounded-lg shadow-lg w-full max-w-4xl">
            <ContractsTable data={data || []} />
          </div>
          <div className="bg-gray-900 text-green-500 p-6 rounded-lg shadow-lg w-full max-w-4xl mt-4">
            <AddContractForm handleSubmit={handleSubmit} newContract={newContract} setNewContract={setNewContract} />
          </div>
        </>
      )}
      {error && <p className="error text-red-500 mt-4">{error.message}</p>}
    </div>
  );
}

function AddContractForm({ handleSubmit, newContract, setNewContract }: { handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void; newContract: string; setNewContract: (value: string) => void }) {
  return <form onSubmit={handleSubmit} className="mt-4">
    <input
      type="text"
      placeholder="https://app.streamflow.finance/contract/solana/mainnet/..."
      value={newContract}
      onChange={(e) => setNewContract(e.target.value)}
      required
      className="bg-gray-800 text-green-500 p-2 rounded-lg w-full mb-2"
    />
    <button type="submit" className="bg-green-500 text-black p-2 rounded-lg w-full">Add Contract</button>
  </form>
}

function ContractsTable({ data }: { data: Contract[] }) {
  return <table className="table-auto w-full text-left">
    <thead>
      <tr>
        <th className="px-4 py-2">Name</th>
        <th className="px-4 py-2">Remaining</th>
        <th className="px-4 py-2">End</th>
      </tr>
    </thead>
    <tbody>
      {data && data.length > 0 && data.map((contract: Contract) => (
        <tr key={contract.created_at} className="bg-gray-800 border-b border-gray-700">
          <td className="px-4 py-2">{contract.name}</td>
          <td className="px-4 py-2">{Number(contract.deposited_amount) - Number(contract.withdrawn_amount)}</td>
          <td className="px-4 py-2">
            {(() => {
              // Convert seconds to milliseconds for JavaScript Date
              const endDate = new Date(contract.end * 1000);
              const now = new Date();
              
              return endDate > now ? (
                <Countdown date={endDate} />
              ) : (
                <span className="text-red-500">Expired</span>
              );
            })()}
          </td>
        </tr>
      ))}
    </tbody>
  </table>;
}

function Countdown({ date }: { date: Date }) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  function calculateTimeLeft() {
    const difference = +date - +new Date();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }

    return timeLeft;
  }

  const timerComponents: JSX.Element[] = [];

  Object.keys(timeLeft).forEach((interval) => {
    //@ts-expect-error type error
    if (timeLeft[interval]) {
      timerComponents.push(
        <span key={interval}>
          {
            //@ts-expect-error type error
          timeLeft[interval]
          } {interval}{" "}
        </span>
      );
    }
  });

  return (
    <div>
      {timerComponents.length ? timerComponents : <span>Time&apos;s up!</span>}
    </div>
  );
}
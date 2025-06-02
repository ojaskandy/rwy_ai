import React from 'react';
import { useLocation } from "wouter";

const Challenges: React.FC = () => {
  const challenges = [
    { name: "Maximum punches in 30 seconds", id: "max-punches" },
    { name: "Reaction Time", id: "reaction-time" },
    { name: "Flashy Kicks", id: "flashy-kicks" },
  ];

  const [, navigate] = useLocation();

  const handleChallengeClick = (challengeId: string) => {
    if (challengeId === "max-punches") {
      navigate("/challenges/max-punches");
    } else {
      console.log(`Challenge clicked: ${challengeId}`);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-10 text-center text-red-500">Take on a Challenge!</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {challenges.map((challenge) => (
          <div
            key={challenge.id}
            className="bg-gray-800 p-6 rounded-xl shadow-2xl cursor-pointer hover:shadow-red-500/50 transition-shadow duration-300 ease-in-out transform hover:-translate-y-1"
            onClick={() => handleChallengeClick(challenge.id)}
          >
            <h2 className="text-2xl font-semibold mb-3 text-red-400">{challenge.name}</h2>
            <p className="text-gray-400">Test your skills and push your limits. Click to start!</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Challenges; 
export default function JerseyMobileAdvancedPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      <div className="text-2xl font-bold bg-blue-600 text-white p-4 rounded mb-4">MOBILE ADVANCED PAGE - JERSEY</div>
      <button className="mt-4 bg-gray-700 px-4 py-2 rounded" onClick={onBack}>Voltar</button>
    </div>
  );
} 
import { useState } from "react";
import { useMessage } from "../../components/Messages";
import { Info } from "lucide-react";

const CreditsPage = () => {
  const [credits, setCredits] = useState(120); // Example: fetched from API
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  const { showMessage } = useMessage();

  const handlePurchase = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAmount) {
      showMessage({ type: "cancel", text: "Please select an amount to purchase." });
      return;
    }

    // Simulate purchase logic
    setCredits((prev) => prev + selectedAmount);
    showMessage({ type: "success", text: `Successfully purchased ${selectedAmount} credits.` });
    setSelectedAmount(null);
  };

  const amounts = [5, 10, 20, 50, 200, 1000];
  const euroPerCredit = 0.5; // Arbitrary cost

  return (
    <div className="credits-container">
      <h1 className="credits-title">Institution Credits</h1>

      <div className="credits-info">
        <span className="credits-balance">Current Balance: {credits} credits</span>
            <div className="credits-tooltip-wrapper group relative flex items-center">
                <Info className="credits-info-icon" />
                <div className="credits-tooltip group-hover:block">
                    Each credit grants access to manage one course for the duration of a single academic semester.
                </div>
            </div>
      </div>

      <form className="credits-form" onSubmit={handlePurchase}>
        <div className="credits-options">
          {amounts.map((amount) => (
            <button
              key={amount}
              type="button"
              className={`credits-option-button ${selectedAmount === amount ? "selected" : ""}`}
              onClick={() => setSelectedAmount(amount)}
            >
              {amount} credits<br />€{(amount * euroPerCredit).toFixed(2)}
            </button>
          ))}
        </div>

        <button type="submit" className="credits-button">
          Purchase Credits
        </button>
      </form>
    </div>
  );
};

export default CreditsPage;
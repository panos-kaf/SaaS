import { useState, useEffect } from "react";
import { useMessage } from "../../components/Messages";
import { Info } from "lucide-react";
import { config } from "../../config";

const CreditsPage = () => {
  const [credits, setCredits] = useState<number | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  const { showMessage } = useMessage();

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const response = await fetch(`${config.apiUrl}/institution/view-creds/1`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          },
        });
        const data = await response.json();
        setCredits(data.credits.available_credits ?? 0);
      } catch (err) {
        setCredits(0);
      }
    };
    fetchCredits();
  }, []);

const handlePurchase = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!selectedAmount) {
    showMessage({ type: "cancel", text: "Please select an amount to purchase." });
    return;
  }

  try {
    const response = await fetch(`${config.apiUrl}/institution/add-creds/1`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem('token') || ''}`,
      },
      body: JSON.stringify({ amount: selectedAmount }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
    setCredits((prev) => (prev ?? 0) + selectedAmount);
    showMessage({
      type: "success",
      text: `Successfully purchased ${selectedAmount} credits. Purchase ID: ${data.purchase_id || "N/A"}`,
      duration: 10000,
    });
    setSelectedAmount(null);
  } else {
      showMessage({ type: "cancel", text: data.message || "Failed to purchase credits." });
    }
  } catch (err) {
    showMessage({ type: "error", text: "An error occurred while purchasing credits." });
  }
};

  const amounts = [5, 10, 20, 50, 200, 1000];
  const euroPerCredit = 0.5; // Arbitrary cost

  return (
    <div className="credits-container">
      <h1 className="credits-title">Institution Credits</h1>

      <div className="credits-info">
        <span className="credits-balance">
          Current Balance: {credits !== null ? `${credits} credits` : '...'}
        </span>
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
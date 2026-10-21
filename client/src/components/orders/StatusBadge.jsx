import { ORDER_STATUS } from "../../utils/orderStatus";

const StatusBadge = ({ status }) => {
  const info = ORDER_STATUS[status] || { label: status, tone: "border-line bg-well text-muted" };

  return (
    <span className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${info.tone}`}>
      {info.label}
    </span>
  );
};

export default StatusBadge;
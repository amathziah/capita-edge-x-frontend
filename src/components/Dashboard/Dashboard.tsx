import { OperationsRoom } from './OperationsRoom';

export function Dashboard() {
  // Explicit height to ensure React Flow has a container to render into
  return (
    <div className="h-[85vh] w-full">
      <OperationsRoom />
    </div>
  );
}

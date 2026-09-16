import DriftPhase2Home from '@/components/drift-phase2-home';
import RentalApp from '@/components/rental-app';

export default function Home() {
  return (
    <>
      <DriftPhase2Home />
      <div className="drift-rental-shell bg-[#f5f5f7]">
        <RentalApp showHero={false} />
      </div>
    </>
  );
}

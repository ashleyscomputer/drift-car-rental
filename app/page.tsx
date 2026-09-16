import DriftCinematicHome from '@/components/drift-cinematic-home';
import RentalApp from '@/components/rental-app';

export default function Home() {
  return (
    <>
      <DriftCinematicHome />
      <style>{`.drift-rental-shell>main>section:first-of-type{display:none}.drift-rental-shell>main{position:relative;z-index:30}`}</style>
      <div className="drift-rental-shell bg-[#f5f5f7]">
        <RentalApp />
      </div>
    </>
  );
}

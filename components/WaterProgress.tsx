import Image from 'next/image';
import '@/styles/WaterComponent.css';

const Watercomponent = ({ progressMeter }: { progressMeter: number }) => {
  
  return (
    <div className="water-container relative w-full">
       {/* Sand layer that recedes as water fills up  */}
      <div className="sand absolute right-0 bottom-0 h-6 w-full rounded-md bg-amber-100/60" 
      style={{ width: `${100 - (10 + progressMeter * 0.9)}%` }}></div>
       {/* Water layer that fills up */}
      <div
        className="relative h-8 overflow-visible"
        style={{ width: `${10 + progressMeter * 0.9}%` }}
      >
        <div className="water rounded-bl-md"></div>
        {progressMeter <= 10 && (
          <div className="relative top-16 ml-7">
            <Image src="/boat.svg" alt="boat" id="boat-static" width={64} height={64} className="w-16" />
          </div>
        )}

        {progressMeter > 10 && (
          <div className="boat-container relative top-16 mr-16 ">
            <Image
              src="/boat.svg"
              alt="boat"
              id="boat"
              width={64}
              height={64}
              className="w-16"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Watercomponent;

import kickingLogoImage from "@assets/image_1750270990042.png";

export default function HighResSilhouette() {
  return (
    <div className="w-32 h-32 md:w-48 md:h-48">
      <img 
        src={kickingLogoImage} 
        alt="CoachT Kicking Logo" 
        className="w-full h-full object-contain"
      />
    </div>
  );
}
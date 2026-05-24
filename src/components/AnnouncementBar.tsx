'use client';

const styleInject = `
  @keyframes marqueeToRight {
    0%   { transform: translate3d(-50%, 0, 0); }
    100% { transform: translate3d(0, 0, 0); }
  }
  .forced-marquee-right {
    display: flex;
    width: max-content;
    animation: marqueeToRight 25s linear infinite;
  }
  .forced-marquee-right:hover {
    animation-play-state: paused;
  }
`;

export default function AnnouncementBar({
  announcementText = 'EID AL ADHA SALE UP TO 20% OFF ENDS SOON... SHOP NOW',
}) {
  if (!announcementText) return null;

  const dots = `<span class="px-4 opacity-40" aria-hidden="true">&#8226;</span>`;

  return (
    <div className="w-full bg-[#09142E] text-white overflow-hidden py-2.5 select-none font-body text-xs font-medium tracking-wider uppercase">
      <style dangerouslySetInnerHTML={{ __html: styleInject }} />

      <div className="forced-marquee-right" aria-label={announcementText.replace(/<[^>]*>/g, '')}>
        {/* Track 1 */}
        <div className="flex items-center shrink-0 px-8">
          <span dangerouslySetInnerHTML={{ __html: announcementText }} />
          <span dangerouslySetInnerHTML={{ __html: dots }} />
          <span dangerouslySetInnerHTML={{ __html: announcementText }} />
          <span dangerouslySetInnerHTML={{ __html: dots }} />
        </div>
        {/* Track 2 */}
        <div className="flex items-center shrink-0 px-8" aria-hidden="true">
          <span dangerouslySetInnerHTML={{ __html: announcementText }} />
          <span dangerouslySetInnerHTML={{ __html: dots }} />
          <span dangerouslySetInnerHTML={{ __html: announcementText }} />
          <span dangerouslySetInnerHTML={{ __html: dots }} />
        </div>
      </div>
    </div>
  );
}

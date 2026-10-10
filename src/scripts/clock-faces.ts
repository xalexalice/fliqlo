import type { timeParts } from '../lib/time.mjs';

export function renderClockFace(display: HTMLElement, id: string, now: Date, part: ReturnType<typeof timeParts>, seconds: boolean, language: string, twentyFour: boolean, showAmPm: boolean) {
  const hands = display.querySelectorAll<SVGElement>('[data-hand]');
  if (hands.length) {
    const angles = { hour: part.hourAngle, minute: part.minuteAngle, second: part.secondAngle };
    hands.forEach(hand => {
      const unit = hand.dataset.hand as keyof typeof angles;
      hand.setAttribute('transform', `rotate(${angles[unit]} 120 120)`);
      if (unit === 'second') hand.style.display = seconds ? '' : 'none';
    });
    display.querySelectorAll<SVGElement>('[data-sub-hand]').forEach(hand => {
      const angle = hand.dataset.subHand === 'second' ? part.secondAngle : hand.dataset.subHand === 'hours' ? (now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600) * 15 : (now.getDate() - 1) / 31 * 360;
      hand.setAttribute('transform', `rotate(${angle} ${hand.dataset.cx} ${hand.dataset.cy})`);
      if (hand.dataset.subHand === 'second') hand.style.display = seconds ? '' : 'none';
    });
    return true;
  }
  if (id === 'aura') {
    display.querySelector('[data-face-time]')!.textContent = `${part.hours}:${part.minutes}${seconds ? `:${part.seconds}` : ''}`;
    display.querySelector('[data-face-period]')!.textContent = twentyFour || !showAmPm ? '' : part.period;
    display.querySelector('[data-face-weekday]')!.textContent = new Intl.DateTimeFormat(language, { weekday: 'long' }).format(now);
    display.querySelector('[data-face-date]')!.textContent = new Intl.DateTimeFormat(language, { year: 'numeric', month: 'long', day: 'numeric' }).format(now);
    return true;
  }
  if (id === 'rolling') {
    const time = `${part.hours}:${part.minutes}:${part.seconds}`;
    display.querySelectorAll<HTMLElement>('[data-digit]').forEach(cell => {
      const index = Number(cell.dataset.digit);
      cell.hidden = !seconds && index > 5;
      const value = time[index], old = cell.dataset.value!;
      if (old === value) return;
      cell.dataset.value = value;
      const strip = document.createElement('span'); strip.className = 'rolling-strip';
      for (const digit of [old, value]) { const span = document.createElement('span'); span.textContent = digit; strip.append(span); }
      cell.replaceChildren(strip);
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) strip.style.transform = 'translateY(-50%)';
      else strip.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-50%)' }], { duration: 400, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
    });
    (display.querySelectorAll<HTMLElement>('.rolling-colon')[1]).hidden = !seconds;
    return true;
  }
  if (id === 'bubble') {
    const digits = part.hours + part.minutes;
    display.querySelectorAll<HTMLElement>('[data-bubble-digit]').forEach(digit => { digit.textContent = digits[Number(digit.dataset.bubbleDigit)]; });
    const label = display.querySelector<HTMLElement>('[data-bubble-seconds]')!;
    label.textContent = part.seconds; label.hidden = !seconds;
    return true;
  }
  if (id === 'nixie') {
    const digits = part.hours + part.minutes + part.seconds;
    display.querySelectorAll<HTMLElement>('[data-nixie-digit]').forEach(digit => { digit.textContent = digits[Number(digit.dataset.nixieDigit)]; });
    display.querySelector<HTMLElement>('.small-row')!.hidden = !seconds;
    display.querySelector<HTMLElement>('[data-nixie-seconds]')!.hidden = !seconds;
    return true;
  }
  return false;
}

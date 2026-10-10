export function timeParts(date, twentyFour = true) {
  const hours = date.getHours();
  return {
    hours: String(twentyFour ? hours : (hours % 12 || 12)).padStart(2, '0'),
    minutes: String(date.getMinutes()).padStart(2, '0'),
    seconds: String(date.getSeconds()).padStart(2, '0'),
    period: hours < 12 ? 'AM' : 'PM',
    hourAngle: (hours % 12) * 30 + date.getMinutes() / 2,
    minuteAngle: date.getMinutes() * 6 + date.getSeconds() / 10,
    secondAngle: date.getSeconds() * 6,
  };
}

export function calculateDistance(lat1, lon1, lat2, lon2) {

  const R = 6371000; // meters

  const dLat =
    (lat2 - lat1) * Math.PI / 180;

  const dLon =
    (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) *
    Math.sin(dLat / 2) +

    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *

    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c =
    2 * Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return R * c;
}

export function generateRecurringDates(
  startTime,
  repeatDays,
  repeatEndDate
) {

  const dates = [];

  const start =
    new Date(startTime);

  const end =
    new Date(repeatEndDate);

  const current =
    new Date(start);

  while (current <= end) {

    if (
      repeatDays.includes(
        current.getDay()
      )
    ) {

      dates.push(
        new Date(current)
      );

    }

    current.setDate(
      current.getDate() + 1
    );
  }

  return dates;

}

export function applyTimeToDate(
  templateDateTime,
  targetDate
) {
  const template =
    new Date(templateDateTime);

  const result =
    new Date(targetDate);

  result.setHours(
    template.getHours(),
    template.getMinutes(),
    template.getSeconds(),
    template.getMilliseconds()
  );

  return result;
}

export function formatLocalDateTime(
  date
) {
  const pad = n =>
    String(n).padStart(2, "0");

  return (
    `${date.getFullYear()}-` +
    `${pad(date.getMonth() + 1)}-` +
    `${pad(date.getDate())}T` +
    `${pad(date.getHours())}:` +
    `${pad(date.getMinutes())}`
  );
}

export function timesOverlap(
  start1,
  end1,
  start2,
  end2
) {

  return (
    new Date(start1) <
    new Date(end2)
  ) &&
    (
      new Date(end1) >
      new Date(start2)
    );

}
const axios = require("axios");
const config = require("../data/config.json");

let shiftStore = {};

const isShiftWanted = (includedTypes, shift) =>
  includedTypes.some((type) => shift.name.startsWith(type));

const hasChanged = (oldOccupation, newOccupation) =>
  oldOccupation.current !== newOccupation.current ||
  oldOccupation.max !== newOccupation.max;

const sendDiscordChangedShiftMessage = (course, shift) => {
  axios.post(course.discordWebhook, {
    content: course.discordMessage,
    embeds: [
      {
        title: `Alteração Turno ${shift.name}`,
        url: "https://fenix.tecnico.ulisboa.pt/login?callback=https://fenix.tecnico.ulisboa.pt/student/enroll/shift-enrollment",
        color:
          shift.occupation.current === shift.occupation.max
            ? 13390675 // red
            : 6736979, // green
        fields: [
          {
            name: "Ocupação",
            value: `${shift.occupation.current}/${shift.occupation.max}`,
          },
        ],
      },
    ],
  });
};

const sendDiscordNewShiftMessage = (course, shift) => {
  axios.post(course.discordWebhook, {
    content: course.discordMessage,
    embeds: [
      {
        title: `Novo Turno ${shift.name}`,
        url: "https://fenix.tecnico.ulisboa.pt/login?callback=https://fenix.tecnico.ulisboa.pt/student/enroll/shift-enrollment",
        color: 5487052,
        fields: [
          {
            name: "Ocupação",
            value: `${shift.occupation.current}/${shift.occupation.max}`,
          },
        ],
      },
    ],
  });
};

const fetchAndCheckAvailable = async () => {
  const isEmptyStore = Object.keys(shiftStore).length === 0;

  await Promise.all(
    config.map(async (course) => {
      const { data } = await axios.get(
        `https://fenix.tecnico.ulisboa.pt/api/fenix/v1/courses/${course.courseId}/schedule?academicTerm=2021/2022&lang=pt-PT`
      );
      data.shifts.forEach((shift) => {
        const shiftId = `${course.courseId}-${shift.name}`;

        if (!isEmptyStore) {
          if (!shiftStore[shiftId]) {
            sendDiscordNewShiftMessage(course, shift);
          } else if (
            isShiftWanted(course.includeType, shift) &&
            hasChanged(shiftStore[shiftId], shift.occupation)
          ) {
            sendDiscordChangedShiftMessage(course, shift);
          }
        }

        shiftStore[shiftId] = shift.occupation;
      });
    })
  );

  console.log(shiftStore);
};

fetchAndCheckAvailable();
setInterval(fetchAndCheckAvailable, 10 * 1000);

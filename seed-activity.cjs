const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8081";

const app = initializeApp({
  projectId: "eduplay-3db71",
});

const db = getFirestore(app);

async function seed() {
  const activityId = "activity-test-001";
  const configId = "config-test-001";
  const ownerTeacherId = "teacher-test-001";

  await db.collection("activities").doc(activityId).set({
    title: "Actividad de prueba",
    description: "Descripción de prueba",
    ownerTeacherId,
    configId,
    type: "quiz",
    isPublished: true,
  });

  await db.collection("activityConfigs").doc(configId).set({
    activityId,
    ownerTeacherId,
    questions: [
      {
        id: "question1",
        type: "multiple-choice",
        text: "Pregunta 1",
        options: [
          {
            id: "option-a",
            text: "Correcta",
          },
          {
            id: "option-b",
            text: "Incorrecta",
          },
        ],
        points: 5,
      },
      {
        id: "question2",
        type: "multiple-choice",
        text: "Pregunta 2",
        options: [
          {
            id: "option-a",
            text: "Incorrecta",
          },
          {
            id: "option-b",
            text: "Correcta",
          },
        ],
        points: 5,
      },
    ],
    passingScore: 6,
  });

  await db.collection("activityAnswerKeys").doc(activityId).set({
    activityId,
    ownerTeacherId,
    answers: {
      question1: "option-a",
      question2: "option-b",
    },
  });

  console.log("Actividad creada correctamente.");
  console.log("activityId:", activityId);
  console.log("configId:", configId);

  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});

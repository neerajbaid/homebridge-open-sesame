import { Sesame3 } from "./accessories/Sesame3";
import { SesameBot } from "./accessories/SesameBot";
import { Sesame2Shadow } from "./types/API";

export function convertToSesame2Shadow(
  deviceType: typeof Sesame3 | typeof SesameBot,
  mechst: string,
): Sesame2Shadow {
  const data = Uint8Array.from(Buffer.from(mechst, "hex"));

  let voltages: Array<number>;
  let percentages: Array<number>;
  let voltage: number;
  let position: number;

  switch (deviceType) {
    case SesameBot:
      voltages = [3.0, 2.9, 2.8, 2.8, 2.7, 2.6, 2.5, 2.5, 2.4, 2.3];
      percentages = [100.0, 50.0, 40.0, 32.0, 21.0, 13.0, 10.0, 7.0, 3.0, 0.0];
      voltage = (Buffer.from(data.slice(0, 2)).readUIntLE(0, 2) * 3.6) / 1023;
      position = 0;
      break;
    default:
      voltages = [6.0, 5.8, 5.7, 5.6, 5.4, 5.2, 5.1, 5.0, 4.8, 4.6];
      percentages = [100.0, 50.0, 40.0, 32.0, 21.0, 13.0, 10.0, 7.0, 3.0, 0.0];
      voltage = (Buffer.from(data.slice(0, 2)).readUIntLE(0, 2) * 7.2) / 1023;
      position = Buffer.from(data.slice(4, 6)).readUIntLE(0, 2);
      break;
  }

  let percentage =
    voltage > voltages[0] ? 100 : voltage < voltages.slice(-1)[0] ? 0 : -1;
  if (percentage === -1) {
    let i = 0;
    while (i < voltages.length - 1) {
      if (voltage > voltages[i] || voltage <= voltages[i + 1]) {
        i = i + 1;
        continue;
      } else {
        const f = (voltage - voltages[i + 1]) / (voltages[i] - voltages[i + 1]);
        const f3 = percentages[i];
        const f4 = percentages[i + 1];
        percentage = f4 + f * (f3 - f4);
        break;
      }
    }
  }

  return {
    batteryPercentage: percentage,
    batteryVoltage: voltage,
    position: position,
    CHSesame2Status: {
      locked: (data[7] & 2) > 0,
      unlocked: (data[7] & 4) > 0,
    },
  };
}

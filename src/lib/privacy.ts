export type SensorPrivacySettings = {
  mouse: boolean;
  eye: boolean;
  voice: boolean;
  cognitive: boolean;
};

export const defaultSensorPrivacySettings: SensorPrivacySettings = {
  mouse: true,
  eye: true,
  voice: true,
  cognitive: true,
};

export function sensorSettingsToList(settings: SensorPrivacySettings) {
  return [
    { key: "mouse" as const, enabled: settings.mouse },
    { key: "eye" as const, enabled: settings.eye },
    { key: "voice" as const, enabled: settings.voice },
    { key: "cognitive" as const, enabled: settings.cognitive },
  ];
}

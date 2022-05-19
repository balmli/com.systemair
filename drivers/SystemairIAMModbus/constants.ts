export enum IntegerType {
  UINT, // Unsigned Integers I
  INT,  // Signed Integers I*
}

export enum RegisterType {
  Holding,
  Input,
}

export interface ModbusParameter {
  register: number;
  sig: IntegerType;
  regType: RegisterType;
  short: string;
  description: string;
  scaleFactor?: number;
  boolean?: boolean;
  min?: number;
  max?: number;
}

export interface ModbusResult {
  value: number | boolean;
}

export type ModbusResultParameter = ModbusParameter & ModbusResult;

export type ModbusParameters = ModbusParameter[];
export type ModbusParametersMap = { [key: string]: ModbusParameter };

export type ModbusResultParameters = ModbusResultParameter[];
export type ModbusResultParametersMap = { [key: string]: ModbusResultParameter };


export const PARAMETERS: ModbusParameters = [
  // Demand control
  {
    register: 1001,
    sig: IntegerType.UINT,
    regType: RegisterType.Input,
    short: 'REG_DEMC_RH_HIGHEST',
    description: 'Highest value of all RH sensors',
    min: 0,
    max: 100,
  },

  // User modes
  {
    register: 1101,
    sig: IntegerType.UINT,
    regType: RegisterType.Holding,
    short: 'REG_USERMODE_HOLIDAY_TIME',
    description: 'Time delay setting for user mode Holiday (days)',
    min: 1,
    max: 365,
  },
  {
    register: 1102,
    sig: IntegerType.UINT,
    regType: RegisterType.Holding,
    short: 'REG_USERMODE_AWAY_TIME',
    description: 'Time delay setting for user mode Away (hours)',
    min: 1,
    max: 72,
  },
  {
    register: 1103,
    sig: IntegerType.UINT,
    regType: RegisterType.Holding,
    short: 'REG_USERMODE_FIREPLACE_TIME',
    description: 'Time delay setting for user mode Fire Place (minutes)',
    min: 1,
    max: 60,
  },
  {
    register: 1104,
    sig: IntegerType.UINT,
    regType: RegisterType.Holding,
    short: 'REG_USERMODE_REFRESH_TIME',
    description: 'Time delay setting for user mode Refresh (minutes)',
    min: 1,
    max: 240,
  },
  {
    register: 1105,
    sig: IntegerType.UINT,
    regType: RegisterType.Holding,
    short: 'REG_USERMODE_CROWDED_TIME',
    description: 'Time delay setting for user mode Crowded (hours)',
    min: 1,
    max: 8,
  },
  {
    register: 1111,
    sig: IntegerType.UINT,
    regType: RegisterType.Input,
    short: 'REG_USERMODE_REMAINING_TIME_L',
    description: 'Remaining time for the state Holiday/Away/Fire Place/Refresh/Crowded, lower 16 bits',
  },
  {
    register: 1112,
    sig: IntegerType.UINT,
    regType: RegisterType.Input,
    short: 'REG_USERMODE_REMAINING_TIME_H',
    description: 'Remaining time for the state Holiday/Away/Fire Place/Refresh/Crowded, higher 16 bits',
  },
  {
    register: 1135,
    sig: IntegerType.UINT,
    regType: RegisterType.Holding,
    short: 'REG_USERMODE_CROWDED_AIRFLOW_LEVEL_SAF',
    description: 'Fan speed level for mode Crowded.\n' +
      '3: Normal\n' +
      '4: High\n' +
      '5: Maximum',
    min: 3,
    max: 5,
  },
  {
    register: 1136,
    sig: IntegerType.UINT,
    regType: RegisterType.Holding,
    short: 'REG_USERMODE_CROWDED_AIRFLOW_LEVEL_EAF',
    description: 'Fan speed level for mode Crowded.\n' +
      '3: Normal\n' +
      '4: High\n' +
      '5: Maximum',
    min: 3,
    max: 5,
  },
  {
    register: 1137,
    sig: IntegerType.UINT,
    regType: RegisterType.Holding,
    short: 'REG_USERMODE_REFRESH_AIRFLOW_LEVEL_SAF',
    description: 'Fan speed level for mode Refresh.\n' +
      '3: Normal\n' +
      '4: High\n' +
      '5: Maximum',
    min: 3,
    max: 5,
  },
  {
    register: 1138,
    sig: IntegerType.UINT,
    regType: RegisterType.Holding,
    short: 'REG_USERMODE_REFRESH_AIRFLOW_LEVEL_EAF',
    description: 'Fan speed level for mode Refresh.\n' +
      '3: Normal\n' +
      '4: High\n' +
      '5: Maximum',
    min: 3,
    max: 5,
  },
  {
    register: 1139,
    sig: IntegerType.UINT,
    regType: RegisterType.Holding,
    short: 'REG_USERMODE_FIREPLACE_AIRFLOW_LEVEL_SAF',
    description: 'Fan speed level for mode Fireplace.\n' +
      '3: Normal\n' +
      '4: High\n' +
      '5: Maximum',
    min: 3,
    max: 5,
  },
  {
    register: 1140,
    sig: IntegerType.UINT,
    regType: RegisterType.Holding,
    short: 'REG_USERMODE_FIREPLACE_AIRFLOW_LEVEL_EAF',
    description: 'Fan speed level for mode Fireplace.\n' +
      '1: Minimum\n' +
      '2: Low\n' +
      '3: Normal',
    min: 1,
    max: 3,
  },
  {
    register: 1141,
    sig: IntegerType.UINT,
    regType: RegisterType.Holding,
    short: 'REG_USERMODE_AWAY_AIRFLOW_LEVEL_SAF',
    description: 'Fan speed level for mode Away.\n' +
      '0: Off(1)\n' +
      '1: Minimum\n' +
      '2: Low\n' +
      '3: Normal.\n' +
      '(1): value Off only allowed if contents of register REG_FAN_MANUAL_STOP_ALLOWED is 1.',
    min: 0,
    max: 3,
  },
  {
    register: 1142,
    sig: IntegerType.UINT,
    regType: RegisterType.Holding,
    short: 'REG_USERMODE_AWAY_AIRFLOW_LEVEL_EAF',
    description: 'Fan speed level for mode Away.\n' +
      '0: Off(1)\n' +
      '1: Minimum\n' +
      '2: Low\n' +
      '3: Normal.\n' +
      '(1): value Off only allowed if contents of register REG_FAN_MANUAL_STOP_ALLOWED is 1.',
    min: 0,
    max: 3,
  },
  {
    register: 1143,
    sig: IntegerType.UINT,
    regType: RegisterType.Holding,
    short: 'REG_USERMODE_HOLIDAY_AIRFLOW_LEVEL_SAF',
    description: 'Fan speed level for mode Holiday.\n' +
      '0: Off(1)\n' +
      '1: Minimum\n' +
      '2: Low\n' +
      '3: Normal.\n' +
      '(1): value Off only allowed if contents of register REG_FAN_MANUAL_STOP_ALLOWED is 1.',
    min: 0,
    max: 3,
  },
  {
    register: 1144,
    sig: IntegerType.UINT,
    regType: RegisterType.Holding,
    short: 'REG_USERMODE_HOLIDAY_AIRFLOW_LEVEL_EAF',
    description: 'Fan speed level for mode Holiday.\n' +
      '0: Off(1)\n' +
      '1: Minimum\n' +
      '2: Low\n' +
      '3: Normal.\n' +
      '(1): value Off only allowed if contents of register REG_FAN_MANUAL_STOP_ALLOWED is 1.',
    min: 0,
    max: 3,
  },
  {
    register: 1145,
    sig: IntegerType.UINT,
    regType: RegisterType.Holding,
    short: 'REG_USERMODE_COOKERHOOD_AIRFLOW_LEVEL_SAF',
    description: 'Fan speed level for mode Cooker Hood.\n' +
      '2: Low\n' +
      '3: Normal\n' +
      '4: High',
    min: 1,
    max: 5,
  },
  {
    register: 1146,
    sig: IntegerType.UINT,
    regType: RegisterType.Holding,
    short: 'REG_USERMODE_COOKERHOOD_AIRFLOW_LEVEL_EAF',
    description: 'Fan speed level for mode Cooker Hood.\n' +
      '2: Low\n' +
      '3: Normal\n' +
      '4: High',
    min: 1,
    max: 5,
  },
  {
    register: 1147,
    sig: IntegerType.UINT,
    regType: RegisterType.Holding,
    short: 'REG_USERMODE_VACUUMCLEANER_AIRFLOW_LEVEL_SAF',
    description: 'Fan speed level for mode Vacuum Cleaner.\n' +
      '2: Low\n' +
      '3: Normal\n' +
      '4: High',
    min: 1,
    max: 5,
  },
  {
    register: 1148,
    sig: IntegerType.UINT,
    regType: RegisterType.Holding,
    short: 'REG_USERMODE_VACUUMCLEANER_AIRFLOW_LEVEL_EAF',
    description: 'Fan speed level for mode Vacuum Cleaner.\n' +
      '2: Low\n' +
      '3: Normal\n' +
      '4: High',
    min: 1,
    max: 5,
  },

  {
    register: 1161,
    sig: IntegerType.UINT,
    regType: RegisterType.Input,
    short: 'REG_USERMODE_MODE',
    description: 'Active User mode.\n' +
      '0: Auto\n' +
      '1: Manual\n' +
      '2: Crowded\n' +
      '3: Refresh\n' +
      '4: Fireplace\n' +
      '5: Away\n' +
      '6: Holiday\n' +
      '7: Cooker Hood\n' +
      '8: Vacuum Cleaner\n' +
      '9: CDI1\n' +
      '10: CDI2\n' +
      '11: CDI3\n' +
      '12: PressureGuard',
    min: 0,
    max: 12,
  },
  {
    register: 1162,
    sig: IntegerType.UINT,
    regType: RegisterType.Holding,
    short: 'REG_USERMODE_HMI_CHANGE_REQUEST',
    description: 'New desired user mode as requested by HMI\n' +
      '0: None\n' +
      '1: Auto\n' +
      '2: Manual\n' +
      '3: Crowded\n' +
      '4: Refresh\n' +
      '5: Fireplace\n' +
      '6: Away\n' +
      '7: Holiday',
    min: 0,
    max: 7,
  },
  {
    register: 1177,
    sig: IntegerType.UINT,
    regType: RegisterType.Holding,
    short: 'REG_PRESSURE_GUARD_AIRFLOW_LEVEL_SAF',
    description: 'Fan speed level for configurable pressure guard function.\n' +
      '0: Off\n' +
      '1: Minimum\n' +
      '2: Low\n' +
      '3: Normal\n' +
      '4: High\n' +
      '5: Maximum',
    min: 0,
    max: 5,
  },
  {
    register: 1178,
    sig: IntegerType.UINT,
    regType: RegisterType.Holding,
    short: 'REG_PRESSURE_GUARD_AIRFLOW_LEVEL_EAF',
    description: 'Fan speed level for configurable pressure guard function.\n' +
      '0: Off\n' +
      '1: Minimum\n' +
      '2: Low\n' +
      '3: Normal\n' +
      '4: High\n' +
      '5: Maximum',
    min: 0,
    max: 5,
  },

  {
    register: 3114,
    sig: IntegerType.UINT,
    regType: RegisterType.Input,
    short: 'REG_FUNCTION_ACTIVE_PRESSURE_GUARD',
    description: 'Indicates if pressure guard is active',
    boolean: true,
  },
  {
    register: 3115,
    sig: IntegerType.UINT,
    regType: RegisterType.Input,
    short: 'REG_FUNCTION_ACTIVE_CDI_1',
    description: 'Indicates if function is active',
    boolean: true,
  },
  {
    register: 3116,
    sig: IntegerType.UINT,
    regType: RegisterType.Input,
    short: 'REG_FUNCTION_ACTIVE_CDI_2',
    description: 'Indicates if function is active',
    boolean: true,
  },
  {
    register: 3117,
    sig: IntegerType.UINT,
    regType: RegisterType.Input,
    short: 'REG_FUNCTION_ACTIVE_CDI_3',
    description: 'Indicates if function is active',
    boolean: true,
  },

  // Airflow control

  {
    register: 12401,
    sig: IntegerType.UINT,
    regType: RegisterType.Input,
    short: 'REG_SENSOR_RPM_SAF',
    description: 'Supply Air Fan RPM indication from TACHO',
    min: 0,
    max: 5000,
  },
  {
    register: 12402,
    sig: IntegerType.UINT,
    regType: RegisterType.Input,
    short: 'REG_SENSOR_RPM_EAF',
    description: 'Extract Air Fan RPM indication from TACHO',
    min: 0,
    max: 5000,
  },
  {
    register: 1131,
    sig: IntegerType.UINT,
    regType: RegisterType.Holding,
    short: 'REG_USERMODE_MANUAL_AIRFLOW_LEVEL_SAF',
    description: 'Fan speed level for mode Manual. Applies to both the SAF and the EAF fan.\n' +
      '0: Off(1)\n' +
      '2: Low\n' +
      '3: Normal\n' +
      '4: High\n' +
      '(1): value Off only allowed if contents of register REG_FAN_MANUAL_STOP_ALLOWED is 1.',
    min: 0,
    max: 4,
  },
  {
    register: 14001,
    sig: IntegerType.UINT,
    regType: RegisterType.Input,
    short: 'REG_OUTPUT_SAF',
    description: 'SAF fan speed',
    min: 0,
    max: 100,
  },
  {
    register: 14002,
    sig: IntegerType.UINT,
    regType: RegisterType.Input,
    short: 'REG_OUTPUT_EAF',
    description: 'EAF fan speed',
    min: 0,
    max: 100,
  },

  // Temperature control

  {
    register: 2001,
    sig: IntegerType.INT,
    regType: RegisterType.Holding,
    short: 'REG_TC_SP',
    description: 'Temperature setpoint for the supply air temperature',
    scaleFactor: 10,
    min: 120,
    max: 300,
  },

  // Cooler
  {
    register: 14201,
    sig: IntegerType.INT,
    regType: RegisterType.Input,
    short: 'REG_OUTPUT_Y3_ANALOG',
    description: 'Cooler AO state',
    min: 0,
    max: 100,
  },
  {
    register: 14202,
    sig: IntegerType.INT,
    regType: RegisterType.Input,
    short: 'REG_OUTPUT_Y3_DIGITAL',
    description: 'Cooler DO state:\n' +
      '0: Output not active\n' +
      '1: Output active',
    boolean: true,
  },

  // Heater
  {
    register: 14101,
    sig: IntegerType.INT,
    regType: RegisterType.Input,
    short: 'REG_OUTPUT_Y1_ANALOG',
    description: 'Heater AO state',
    min: 0,
    max: 100,
  },
  {
    register: 14102,
    sig: IntegerType.INT,
    regType: RegisterType.Input,
    short: 'REG_OUTPUT_Y1_DIGITAL',
    description: 'Heater DO state:\n' +
      '0: Output not active\n' +
      '1: Output active',
    boolean: true,
  },

  // Extra controller
  // Change-over (Heating/Cooling)
  // Moisture transfer control
  // Cooling recovery

  // ECO mode
  {
    register: 2505,
    sig: IntegerType.UINT,
    regType: RegisterType.Holding,
    short: 'REG_ECO_MODE_ON_OFF',
    description: 'Enabling of eco mode',
    boolean: true,
  },

  // Free Cooling
  // Week Schedule
  // Time and Date

  // Filter replacement
  {
    register: 7005,
    sig: IntegerType.UINT,
    regType: RegisterType.Input,
    short: 'REG_FILTER_REMAINING_TIME_L',
    description: 'Remaining filter time in seconds, lower 16 bits',
  },
  {
    register: 7006,
    sig: IntegerType.UINT,
    regType: RegisterType.Input,
    short: 'REG_FILTER_REMAINING_TIME_H',
    description: 'Remaining filter time in seconds, higher 16 bits',
  },

  // Analog Input values (Temperatures, CO2, RH)
  {
    register: 12102,
    sig: IntegerType.INT,
    regType: RegisterType.Holding,
    short: 'REG_SENSOR_OAT',
    description: 'Outdoor Air Temperature sensor (standard)',
    scaleFactor: 10,
    min: -400,
    max: 800,
  },
  {
    register: 12103,
    sig: IntegerType.INT,
    regType: RegisterType.Holding,
    short: 'REG_SENSOR_SAT',
    description: 'Supply Air Temperature sensor (standard)',
    scaleFactor: 10,
    min: -400,
    max: 800,
  },
  {
    register: 12105,
    sig: IntegerType.INT,
    regType: RegisterType.Holding,
    short: 'REG_SENSOR_EAT',
    description: 'Extract Air Temperature sensor (accessory)',
    scaleFactor: 10,
    min: -400,
    max: 800,
  },
  {
    register: 12108,
    sig: IntegerType.INT,
    regType: RegisterType.Holding,
    short: 'REG_SENSOR_OHT',
    description: 'Overheat Temperature sensor (Electrical Heater)',
    scaleFactor: 10,
    min: -400,
    max: 800,
  },
  {
    register: 12109,
    sig: IntegerType.UINT,
    regType: RegisterType.Holding,
    short: 'REG_SENSOR_RHS',
    description: 'Relative Humidity Sensor (Accessory)',
    min: 0,
    max: 100,
  },
  {
    register: 12544,
    sig: IntegerType.INT,
    regType: RegisterType.Holding,
    short: 'REG_SENSOR_PDM_EAT_VALUE',
    description: 'PDM EAT sensor value (standard)',
    scaleFactor: 10,
    min: -400,
    max: 800,
  },
  {
    register: 12136,
    sig: IntegerType.UINT,
    regType: RegisterType.Holding,
    short: 'REG_SENSOR_RHS_PDM',
    description: 'PDM RHS sensor value (standard)',
    min: 0,
    max: 100,
  },

  // Digital Input functions
  // Output values
  // Alarms
  {
    register: 15086,
    sig: IntegerType.UINT,
    regType: RegisterType.Input,
    short: 'REG_ALARM_EAT_ALARM',
    description: 'Extract air temperature',
    min: 0,
    max: 3,
  },
  {
    register: 15142,
    sig: IntegerType.UINT,
    regType: RegisterType.Input,
    short: 'REG_ALARM_FILTER_ALARM',
    description: 'Filter',
    min: 0,
    max: 3,
  },
  {
    register: 15544,
    sig: IntegerType.UINT,
    regType: RegisterType.Input,
    short: 'REG_ALARM_FILTER_WARNING_ALARM',
    description: 'Filter warning',
    min: 0,
    max: 3,
  },
  {
    register: 15901,
    sig: IntegerType.UINT,
    regType: RegisterType.Input,
    short: 'REG_ALARM_TYPE_A',
    description: 'Indicates if an alarm Type A is active',
    boolean: true,
  },
  {
    register: 15902,
    sig: IntegerType.UINT,
    regType: RegisterType.Input,
    short: 'REG_ALARM_TYPE_B',
    description: 'Indicates if an alarm Type B is active',
    boolean: true,
  },
  {
    register: 15903,
    sig: IntegerType.UINT,
    regType: RegisterType.Input,
    short: 'REG_ALARM_TYPE_C',
    description: 'Indicates if an alarm Type C is active',
    boolean: true,
  },

];

export const PARAMETER_MAP: ModbusParametersMap = PARAMETERS.reduce((obj: {}, r) => {
  // @ts-ignore
  obj[r.short] = r;
  return obj;
}, {});

export const OPERATION_PARAMETERS = [
  'REG_TC_SP',
  'REG_USERMODE_MANUAL_AIRFLOW_LEVEL_SAF',
  'REG_USERMODE_MODE',
  'REG_ECO_MODE_ON_OFF',
  'REG_SENSOR_RPM_SAF',
  'REG_SENSOR_RPM_EAF',
  'REG_OUTPUT_SAF',
  'REG_OUTPUT_EAF',
].map((key) => PARAMETER_MAP[key]);

export const SENSOR_PARAMETERS = [
  'REG_SENSOR_RHS_PDM',
  'REG_SENSOR_OAT',
  'REG_SENSOR_SAT',
  'REG_SENSOR_PDM_EAT_VALUE',
  'REG_SENSOR_OHT',
].map((key) => PARAMETER_MAP[key]);

export const CONFIG_PARAMETERS = [
  'REG_FILTER_REMAINING_TIME_L',
  'REG_FILTER_REMAINING_TIME_H',
  'REG_USERMODE_CROWDED_AIRFLOW_LEVEL_SAF',
  'REG_USERMODE_REFRESH_AIRFLOW_LEVEL_SAF',
  'REG_USERMODE_FIREPLACE_AIRFLOW_LEVEL_SAF',
  'REG_USERMODE_AWAY_AIRFLOW_LEVEL_SAF',
  'REG_USERMODE_HOLIDAY_AIRFLOW_LEVEL_SAF',
  'REG_USERMODE_COOKERHOOD_AIRFLOW_LEVEL_SAF',
  'REG_USERMODE_VACUUMCLEANER_AIRFLOW_LEVEL_SAF',
  'REG_PRESSURE_GUARD_AIRFLOW_LEVEL_SAF',
].map((key) => PARAMETER_MAP[key]);

export const ALARMS = [
  'REG_ALARM_EAT_ALARM',
  'REG_ALARM_FILTER_ALARM',
  'REG_ALARM_FILTER_WARNING_ALARM',
  'REG_ALARM_TYPE_A',
  'REG_ALARM_TYPE_B',
  'REG_ALARM_TYPE_C',
].map((key) => PARAMETER_MAP[key]);

export const FUNCTIONS = [
  'REG_FUNCTION_ACTIVE_PRESSURE_GUARD',
  'REG_FUNCTION_ACTIVE_CDI_1',
  'REG_FUNCTION_ACTIVE_CDI_2',
  'REG_FUNCTION_ACTIVE_CDI_3',
].map((key) => PARAMETER_MAP[key]);

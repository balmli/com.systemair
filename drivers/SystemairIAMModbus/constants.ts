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


export const READ_PARAMETERS: ModbusParameters = [
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
    register: 2001,
    sig: IntegerType.INT,
    regType: RegisterType.Holding,
    short: 'REG_TC_SP',
    description: 'Temperature setpoint for the supply air temperature',
    scaleFactor: 10,
    min: 120,
    max: 300,
  },
/*
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
*/
  {
    register: 2505,
    sig: IntegerType.UINT,
    regType: RegisterType.Holding,
    short: 'REG_ECO_MODE_ON_OFF',
    description: 'Enabling of eco mode',
    boolean: true,
  },
];

export const READ_PARAMETERS_MAP: ModbusParametersMap = READ_PARAMETERS.reduce((obj: {}, r) => {
  // @ts-ignore
  obj[r.short] = r;
  return obj;
}, {});

export const READ_PARAMETERS_2: ModbusParameters = [
  /*{
    register: 1001,
    sig: IntegerType.UINT,
    regType: RegisterType.Input,
    short: 'REG_DEMC_RH_HIGHEST',
    description: 'Highest value of all RH sensors',
    min: 0,
    max: 100,
  },*/
  {
    register: 12136,
    sig: IntegerType.UINT,
    regType: RegisterType.Holding,
    short: 'REG_SENSOR_RHS_PDM',
    description: 'PDM RHS sensor value (standard)',
    min: 0,
    max: 100,
  },
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
  /*{
    register: 12105,
    sig: IntegerType.INT,
    regType: RegisterType.Holding,
    short: 'REG_SENSOR_EAT',
    description: 'Extract Air Temperature sensor (accessory)',
    scaleFactor: 10,
    min: -400,
    max: 800,
  },*/
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
    register: 12108,
    sig: IntegerType.INT,
    regType: RegisterType.Holding,
    short: 'REG_SENSOR_OHT',
    description: 'Overheat Temperature sensor (Electrical Heater)',
    scaleFactor: 10,
    min: -400,
    max: 800,
  },
  /*{
    register: 12109,
    sig: IntegerType.UINT,
    regType: RegisterType.Holding,
    short: 'REG_SENSOR_RHS',
    description: 'Relative Humidity Sensor (Accessory)',
    min: 0,
    max: 100,
  },*/
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
];



export const UPDATE_PARAMETERS: ModbusParameters = [
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
];

export const UPDATE_PARAMETERS_MAP: ModbusParametersMap = UPDATE_PARAMETERS.reduce((obj: {}, r) => {
  // @ts-ignore
  obj[r.short] = r;
  return obj;
}, {});

export const ALARMS: ModbusParameters = [
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

export const FUNCTIONS: ModbusParameters = [
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
];

const FAN_MODES_LIST = {
  '1': 'Off',
  '2': 'Low',
  '3': 'Normal',
  '4': 'High'
};

const FAN_MODES = {
  '1': 'Off',
  '2': 'Low',
  '3': 'Normal',
  '4': 'High',
  '5': 'Maximum'
};

const MODES_LIST = {
  '0': 'Auto',
  '1': 'Manual'
};

const MODES = {
  '0': 'Auto',
  '1': 'Manual',
  '2': 'Crowded',
  '3': 'Refresh',
  '4': 'Fireplace',
  '5': 'Away',
  '6': 'Holiday'
};

const READ_PARAMETERS = [
  "components_filter_time_left",
  "eco_mode",
  "control_regulation_temp_unit",
  "main_temperature_offset",
  "main_user_mode",
  "main_airflow",
  "speed_indication_app",
  "demand_control_fan_speed",
  "control_regulation_speed_after_free_cooling_saf",
  "control_regulation_speed_after_free_cooling_eaf",
  "outdoor_air_temp",
  "supply_air_temp",
  "pdm_input_temp_value",
  "pdm_input_rh_value",
  "overheat_temp",
  "rh_sensor",
  "digital_input_tacho_saf_value",
  "digital_input_tacho_eaf_value",
  "digital_input_type1",
  "digital_input_type2",
  "digital_input_value1",
  "digital_input_value2",
];

const ALARMS = [
  {
    id: "alarm_co2_state",
    description: "CO2"
  },
  {
    id: "alarm_defrosting_state",
    description: "Defrosting"
  },
  {
    id: "alarm_eaf_rpm_state",
    description: "Extract air fan RPM"
  },
  {
    id: "alarm_eat_state",
    description: "Extract air temperature"
  },
  {
    id: "alarm_emt_state",
    description: "Frost protection (EMT)"
  },
  {
    id: "alarm_filter_state",
    description: "Filter"
  },
  {
    id: "alarm_filter_warning_state",
    description: "Filter warning"
  },
  {
    id: "alarm_fire_alarm_state",
    description: "Fire alarm"
  },
  {
    id: "alarm_frost_prot_state",
    description: "Frost protection"
  },
  {
    id: "alarm_low_sat_state",
    description: "Low supply air temperature"
  },
  {
    id: "alarm_manual_mode_state",
    description: "Manual mode"
  },
  {
    id: "alarm_overheat_temperature_state",
    description: "Overheat temperature"
  },
  {
    id: "alarm_pdm_rhs_state",
    description: "Rel. humidity sensor malfunction"
  },
  {
    id: "alarm_rgs_state",
    description: "Rotation guard (RGS)"
  },
  {
    id: "alarm_rh_state",
    description: "Rel. humidity sensor malfunction"
  },
  {
    id: "alarm_rotor_motor_feedback_state",
    description: "Rotor motor feedback"
  },
  {
    id: "alarm_saf_rpm_state",
    description: "Supply air fan RPM"
  },
  {
    id: "alarm_sat_state",
    description: "Supply air temperature"
  },
];

const FUNCTIONS = [
  {
    id: "function_active_configurable_di1",
    description: "Configurable DI1"
  },
  {
    id: "function_active_configurable_di2",
    description: "Configurable DI2"
  },
  {
    id: "function_active_configurable_di3",
    description: "Configurable DI3"
  },
  {
    id: "function_active_cooker_hood",
    description: "Cooker hood"
  },
  {
    id: "function_active_cooling_recovery",
    description: "Cooling recovery"
  },
  {
    id: "function_active_cooling",
    description: "Cooling"
  },
  {
    id: "function_active_defrosting",
    description: "Defrosting"
  },
  {
    id: "function_active_free_cooling",
    description: "Free cooling"
  },
  {
    id: "function_active_heat_recovery",
    description: "Heat recovery"
  },
  {
    id: "function_active_heater_cooldown",
    description: "Heater cooldown"
  },
  {
    id: "function_active_heating",
    description: "Heating"
  },
  {
    id: "function_active_moisture_transfer",
    description: "Moisture transfer"
  },
  {
    id: "function_active_pressure_guard",
    description: "Pressure guard"
  },
  {
    id: "function_active_secondary_air",
    description: "Secondary air"
  },
  {
    id: "function_active_service_user_lock",
    description: "Service user lock"
  },
  {
    id: "function_active_vacuum_cleaner",
    description: "Vacuum cleaner"
  },
];

module.exports = {
  FAN_MODES_LIST: FAN_MODES_LIST,
  FAN_MODES: FAN_MODES,
  MODES_LIST: MODES_LIST,
  MODES: MODES,
  READ_PARAMETERS: READ_PARAMETERS,
  ALARMS: ALARMS,
  FUNCTIONS: FUNCTIONS,
};

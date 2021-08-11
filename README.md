# Systemair support for Athom Homey

With this app and a Systemair Z-wave adapter or a Systemair Internet access module (IAM), you can control your Systemair HVAC.

You can control the set point temperature, set the fan mode and mode.

## Device: Systemair IAM Cloud

This device supports the Systemair Internett access module in "Cloud" mode.  "Modbus TCP" mode is not supported.

#### Triggers

- Set point temperature was changed
- Temperature changed
- Humidity changed
- Fan mode changed
- Mode changed
- The extract air temperature changed
- The outdoor air temperature changed
- The overheat temperature changed
- The supply air temperature changed
- Alarm activated (Alarm code, Alarm description)
- Specific alarm activated (Alarm code, Alarm description)
- Function activated (Function code, Function description)
- Function deactivated (Function code, Function description)
- Specific function activated (Function code, Function description)
- Specific function deactivated (Function code, Function description)

#### Conditions

- Fan mode is/isn't
- Mode is/isn't
- Alarm is/isn't active
- Function is/isn't active

#### Actions

- Set temperature
- Set fan mode
- Set mode
- Initiate boost mode
- Initiate away mode
- Initiate crowded mode
- Initiate fireplace mode
- Initiate holiday mode
- Initiate refresh mode

#### Capabilities

- Target temperature
- Temperature
- Mode
- Fan mode
- Supply air temperature
- Extract air temperature
- Outdoor air temperature
- Overheat temperature
- Humidity
- Cooker hood (as a tag)
- Days before filter replacement
- Extract air fan regulation speed
- Extract air fan RPM
- Supply air fan regulation speed
- Supply air fan RPM

## Device: Systemair Z-wave

This devices supports the Systemair Z-wave adapter.

#### Triggers

- Alarm (tokens: info)

#### Actions

- Set fan mode
- Set mode
- Initiate boost mode

## Acknowledgements:

Thanks to https://github.com/perara/python-systemair-savecair for communicating with the Systemair IAM.

## Disclaimer:

Use at your own risk. I accept no responsibility for any damages caused by using this app.


## Release Notes:

#### 1.2.1

- Updated Z-Wave driver

#### 1.2.0

- Fixes after changes to the logon method

#### 1.1.2

- Changed minimum target temperature to 12 °C

#### 1.1.1

- Fixes for flow titles

#### 1.1.0

- Added 'Specific alarm activated' trigger
- Added 'Function activated', 'Specific function activated', 'Function deactivated' and 'Specific function deactivated' triggers
- Added 'Function is/isn't active' condition
- Added capabilities for extract and supply fan speeds
- Removed 'Cooker hood changed' trigger

#### 1.0.2

- Added support for alarms

#### 1.0.1

- Added "Days before filter replacement"
- Swapped order for Overheat temperature and Humidity

#### 1.0.0

- Added support for cooker hoods
- Added capability for overheat temperature
- Added capability for days before filter replacement
- Updated to firmware 5.0.0

#### 0.9.9

- Updated dependencies

#### 0.9.8

- Systemair IAM Cloud: added Extract air temperature
- Systemair IAM Cloud: added Outdoor, Supply and Extract temperature changed triggers

#### 0.9.7

- Systemair IAM Cloud: view Mode and Fan mode as sensors

#### 0.9.6

- Systemair IAM Cloud: added conditions for fan mode and mode
- Systemair IAM Cloud: added triggers for fan mode changed and mode changed
- Systemair IAM Cloud: added boost mode
- Systemair IAM Cloud: added modes for Away, Crowded, Fireplace, Holiday and Refresh

#### 0.9.5

- Systemair IAM Cloud: fixed icon

#### 0.9.4

- Systemair IAM Cloud: fixed an issue about setting modes between Auto and Manual
- Systemair IAM Cloud: added check for IAM / password when adding the device
- Systemair IAM Cloud: added polling interval to Advanced settings. Default is 30 seconds.
- Fixed README
- Renamed 'Systemair HVAC adapter' to 'Systemair Z-wave'

#### 0.9.3

- Initial support for the Internet Access Module (Cloud)

#### 0.9.2

- Fixed 'Set fan mode' action

#### 0.9.0

- First version for app store

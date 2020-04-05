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

#### Conditions

- Fan mode is
- Mode is

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

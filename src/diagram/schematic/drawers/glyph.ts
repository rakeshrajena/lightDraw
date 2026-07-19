/**
 * Schematic glyph dispatch (kind → drawer).
 */
import type { App } from '../../../App';
import type { Group } from '../../../shapes/Group';
import { getActiveDiagram } from '../../theme';
import { resolveSchematicSymbolKind } from '../resolve';
import { MID, stroke, muted, addLeads, addLine, addCircle, addText, addBox } from './helpers';
import { drawResistor, drawCapacitor, drawInductor, drawCrystal, drawTransformer } from './passives';
import {
  drawDiode,
  drawBjt,
  drawMosfet,
  drawJfet,
  drawUjt,
  drawDarlington,
  drawIgbt,
  drawThyristor,
} from './semiconductors';
import { drawLogic, drawOpAmp, drawIcBox } from './logicAnalog';
import { drawSwitch, drawRelay, drawMotor, drawConnector, drawSensor, drawMeter } from './electromechanical';
import {
  drawGround,
  drawBattery,
  drawSource,
  drawFuse,
  drawWireStub,
  drawJunction,
  drawNoConnect,
  drawPowerFlag,
  drawTestPoint,
  drawFan,
  drawHeatsink,
  drawMountingHole,
} from './powerMisc';

export function drawSchematicGlyph(app: App, g: Group, kind: string): void {
  const k = resolveSchematicSymbolKind(kind);
  switch (k) {
    case 'resistor':
      drawResistor(app, g, 'fixed');
      break;
    case 'variableResistor':
      drawResistor(app, g, 'variable');
      break;
    case 'potentiometer':
      drawResistor(app, g, 'pot');
      break;
    case 'trimmer':
      drawResistor(app, g, 'variable');
      addLine(app, g, 20, 12, 8, 0, 1.5);
      break;
    case 'thermistorNtc':
      drawResistor(app, g, 'thermNtc');
      break;
    case 'thermistorPtc':
      drawResistor(app, g, 'thermPtc');
      break;
    case 'photoresistor':
      drawResistor(app, g, 'ldr');
      break;
    case 'varistor':
      drawResistor(app, g, 'mov');
      break;
    case 'capacitor':
      drawCapacitor(app, g, 'np');
      break;
    case 'electrolyticCap':
      drawCapacitor(app, g, 'electrolytic');
      break;
    case 'variableCap':
      drawCapacitor(app, g, 'variable');
      break;
    case 'inductor':
      drawInductor(app, g, 'fixed');
      break;
    case 'variableInductor':
      drawInductor(app, g, 'variable');
      break;
    case 'ferriteBead':
      drawInductor(app, g, 'ferrite');
      break;
    case 'rfCoil':
      drawInductor(app, g, 'rf');
      break;
    case 'transformer':
      drawTransformer(app, g, false);
      break;
    case 'autotransformer':
      drawTransformer(app, g, true);
      break;
    case 'crystal':
      drawCrystal(app, g, false);
      break;
    case 'ceramicResonator':
      drawCrystal(app, g, true);
      break;
    case 'battery':
      drawBattery(app, g, 2);
      break;
    case 'cell':
      drawBattery(app, g, 1);
      break;
    case 'dcSupply':
      drawSource(app, g, 'dc');
      break;
    case 'acSupply':
      drawSource(app, g, 'ac');
      break;
    case 'voltageSource':
      drawSource(app, g, 'voltage');
      break;
    case 'currentSource':
      drawSource(app, g, 'current');
      break;
    case 'ground':
    case 'earthGround':
      drawGround(app, g, 'earth');
      break;
    case 'chassisGround':
      drawGround(app, g, 'chassis');
      break;
    case 'signalGround':
      drawGround(app, g, 'signal');
      break;
    case 'powerFlag':
      drawPowerFlag(app, g);
      break;
    case 'fuse':
      drawFuse(app, g, false);
      break;
    case 'circuitBreaker':
    case 'polyfuse':
      drawFuse(app, g, true);
      break;
    case 'diode':
      drawDiode(app, g, 'std');
      break;
    case 'schottky':
      drawDiode(app, g, 'schottky');
      break;
    case 'zener':
      drawDiode(app, g, 'zener');
      break;
    case 'tvs':
      drawDiode(app, g, 'tvs');
      break;
    case 'led':
    case 'indicatorLed':
      drawDiode(app, g, 'led');
      break;
    case 'infraredLed':
      drawDiode(app, g, 'ir');
      break;
    case 'laserDiode':
      drawDiode(app, g, 'laser');
      break;
    case 'photodiode':
      drawDiode(app, g, 'photo');
      break;
    case 'bridgeRectifier':
      drawDiode(app, g, 'bridge');
      break;
    case 'tunnelDiode':
      drawDiode(app, g, 'tunnel');
      break;
    case 'varicap':
      drawDiode(app, g, 'varicap');
      break;
    case 'npn':
      drawBjt(app, g, false);
      break;
    case 'darlington':
      drawDarlington(app, g);
      break;
    case 'phototransistor':
      drawBjt(app, g, false, true);
      break;
    case 'pnp':
      drawBjt(app, g, true);
      break;
    case 'nmos':
      drawMosfet(app, g, false);
      break;
    case 'pmos':
      drawMosfet(app, g, true);
      break;
    case 'njfet':
      drawJfet(app, g, false);
      break;
    case 'pjfet':
      drawJfet(app, g, true);
      break;
    case 'ujt':
      drawUjt(app, g);
      break;
    case 'igbt':
      drawIgbt(app, g);
      break;
    case 'scr':
    case 'thyristor':
      drawThyristor(app, g, 'scr');
      break;
    case 'triac':
      drawThyristor(app, g, 'triac');
      break;
    case 'diac':
      drawThyristor(app, g, 'diac');
      break;
    case 'gto':
      drawThyristor(app, g, 'gto');
      break;
    case 'notGate':
      drawLogic(app, g, 'not');
      break;
    case 'buffer':
      drawLogic(app, g, 'buffer');
      break;
    case 'andGate':
      drawLogic(app, g, 'and');
      break;
    case 'nandGate':
      drawLogic(app, g, 'nand');
      break;
    case 'orGate':
      drawLogic(app, g, 'or');
      break;
    case 'norGate':
      drawLogic(app, g, 'nor');
      break;
    case 'xorGate':
      drawLogic(app, g, 'xor');
      break;
    case 'xnorGate':
      drawLogic(app, g, 'xnor');
      break;
    case 'schmittTrigger':
      drawLogic(app, g, 'schmitt');
      break;
    case 'comparator':
    case 'voltageComparator':
      drawOpAmp(app, g, 'comp');
      break;
    case 'opAmp':
      drawOpAmp(app, g, 'op');
      break;
    case 'instrumentationAmp':
      drawOpAmp(app, g, 'inst');
      break;
    case 'voltageReference':
      drawIcBox(app, g, 'VREF');
      break;
    case 'voltageRegulator':
      drawIcBox(app, g, 'REG');
      break;
    case 'ldo':
      drawIcBox(app, g, 'LDO');
      break;
    case 'buck':
      drawIcBox(app, g, 'BUCK');
      break;
    case 'boost':
      drawIcBox(app, g, 'BOOST');
      break;
    case 'buckBoost':
      drawIcBox(app, g, 'BB');
      break;
    case 'chargePump':
      drawIcBox(app, g, 'CP');
      break;
    case 'dac':
      drawIcBox(app, g, 'DAC');
      break;
    case 'adc':
      drawIcBox(app, g, 'ADC');
      break;
    case 'pll':
      drawIcBox(app, g, 'PLL');
      break;
    case 'mcu':
      drawIcBox(app, g, 'MCU');
      break;
    case 'mpu':
      drawIcBox(app, g, 'MPU');
      break;
    case 'dsp':
      drawIcBox(app, g, 'DSP');
      break;
    case 'fpga':
      drawIcBox(app, g, 'FPGA');
      break;
    case 'cpld':
      drawIcBox(app, g, 'CPLD');
      break;
    case 'rom':
      drawIcBox(app, g, 'ROM');
      break;
    case 'eeprom':
      drawIcBox(app, g, 'EEPROM');
      break;
    case 'flash':
      drawIcBox(app, g, 'FLASH');
      break;
    case 'sram':
      drawIcBox(app, g, 'SRAM');
      break;
    case 'dram':
      drawIcBox(app, g, 'DRAM');
      break;
    case 'rtc':
      drawIcBox(app, g, 'RTC');
      break;
    case 'timerIc':
      drawIcBox(app, g, '555');
      break;
    case 'counter':
      drawIcBox(app, g, 'CNT');
      break;
    case 'shiftRegister':
      drawIcBox(app, g, 'SR');
      break;
    case 'mux':
      drawIcBox(app, g, 'MUX');
      break;
    case 'demux':
      drawIcBox(app, g, 'DEMUX');
      break;
    case 'encoder':
      drawIcBox(app, g, 'ENC');
      break;
    case 'decoder':
      drawIcBox(app, g, 'DEC');
      break;
    case 'latch':
      drawIcBox(app, g, 'LATCH');
      break;
    case 'flipFlop':
      drawIcBox(app, g, 'FF');
      break;
    case 'tempSensor':
      drawSensor(app, g, 'TEMP');
      break;
    case 'humiditySensor':
      drawSensor(app, g, 'HUM');
      break;
    case 'pressureSensor':
      drawSensor(app, g, 'PRES');
      break;
    case 'lightSensor':
      drawSensor(app, g, 'LIGHT');
      break;
    case 'hallSensor':
      drawSensor(app, g, 'HALL');
      break;
    case 'currentSensor':
      drawSensor(app, g, 'I-SENS');
      break;
    case 'voltageSensor':
      drawSensor(app, g, 'V-SENS');
      break;
    case 'gasSensor':
      drawSensor(app, g, 'GAS');
      break;
    case 'accelerometer':
      drawSensor(app, g, 'ACC');
      break;
    case 'gyroscope':
      drawSensor(app, g, 'GYRO');
      break;
    case 'magnetometer':
      drawSensor(app, g, 'MAG');
      break;
    case 'ultrasonicSensor':
      drawSensor(app, g, 'US');
      break;
    case 'proximitySensor':
      drawSensor(app, g, 'PROX');
      break;
    case 'pirSensor':
      drawSensor(app, g, 'PIR');
      break;
    case 'touchSensor':
      drawSensor(app, g, 'TOUCH');
      break;
    case 'microphone':
      drawSensor(app, g, 'MIC');
      break;
    case 'relay':
    case 'reedRelay':
      drawRelay(app, g);
      break;
    case 'solenoid':
      drawMotor(app, g, 'SOL');
      break;
    case 'dcMotor':
      drawMotor(app, g, 'M');
      break;
    case 'acMotor':
      drawMotor(app, g, 'AC');
      break;
    case 'stepperMotor':
      drawMotor(app, g, 'STEP');
      break;
    case 'servoMotor':
      drawMotor(app, g, 'SERVO');
      break;
    case 'buzzer':
    case 'piezoBuzzer':
      drawMotor(app, g, 'BZ');
      break;
    case 'speaker':
      drawMotor(app, g, 'SPK');
      break;
    case 'lamp':
      drawMotor(app, g, 'LAMP');
      break;
    case 'sevenSegment':
      drawIcBox(app, g, '7SEG');
      break;
    case 'lcd':
      drawIcBox(app, g, 'LCD');
      break;
    case 'oled':
      drawIcBox(app, g, 'OLED');
      break;
    case 'switch':
    case 'spst':
    case 'toggleSwitch':
      drawSwitch(app, g, 'spst');
      break;
    case 'spdt':
      drawSwitch(app, g, 'spdt');
      break;
    case 'dpst':
      drawSwitch(app, g, 'dpst');
      break;
    case 'dpdt':
      drawSwitch(app, g, 'dpdt');
      break;
    case 'pushButtonNo':
      drawSwitch(app, g, 'push');
      break;
    case 'pushButtonNc':
      drawSwitch(app, g, 'nc');
      break;
    case 'slideSwitch':
    case 'dipSwitch':
      drawSwitch(app, g, 'slide');
      break;
    case 'rotarySwitch':
      drawSwitch(app, g, 'rotary');
      break;
    case 'reedSwitch':
      drawSwitch(app, g, 'reed');
      break;
    case 'limitSwitch':
      drawSwitch(app, g, 'limit');
      break;
    case 'keySwitch':
      drawSwitch(app, g, 'key');
      break;
    case 'eStop':
      drawSwitch(app, g, 'estop');
      break;
    case 'connector':
      drawConnector(app, g, 'CONN');
      break;
    case 'terminalBlock':
      drawConnector(app, g, 'TB');
      break;
    case 'header':
      drawConnector(app, g, 'HDR');
      break;
    case 'socket':
      drawConnector(app, g, 'SKT');
      break;
    case 'jumper':
      drawConnector(app, g, 'JMP');
      break;
    case 'usbConnector':
    case 'usb':
      drawConnector(app, g, 'USB');
      break;
    case 'rj45':
      drawConnector(app, g, 'RJ45');
      break;
    case 'hdmi':
      drawConnector(app, g, 'HDMI');
      break;
    case 'db9':
      drawConnector(app, g, 'DB9');
      break;
    case 'barrelJack':
      drawConnector(app, g, 'DCJ');
      break;
    case 'coax':
    case 'sma':
    case 'bnc':
      drawConnector(app, g, 'RF');
      break;
    case 'uart':
      drawIcBox(app, g, 'UART');
      break;
    case 'spi':
      drawIcBox(app, g, 'SPI');
      break;
    case 'i2c':
      drawIcBox(app, g, 'I²C');
      break;
    case 'canBus':
      drawIcBox(app, g, 'CAN');
      break;
    case 'linBus':
      drawIcBox(app, g, 'LIN');
      break;
    case 'rs232':
      drawIcBox(app, g, 'RS232');
      break;
    case 'rs485':
      drawIcBox(app, g, 'RS485');
      break;
    case 'ethernetPhy':
      drawIcBox(app, g, 'PHY');
      break;
    case 'bluetooth':
      drawIcBox(app, g, 'BT');
      break;
    case 'wifi':
      drawIcBox(app, g, 'WiFi');
      break;
    case 'nfc':
      drawIcBox(app, g, 'NFC');
      break;
    case 'zigbee':
      drawIcBox(app, g, 'ZB');
      break;
    case 'lora':
      drawIcBox(app, g, 'LoRa');
      break;
    case 'gps':
      drawIcBox(app, g, 'GPS');
      break;
    case 'esdProtection':
    case 'reversePolarity':
      drawDiode(app, g, 'tvs');
      break;
    case 'sparkGap':
    case 'gdt':
      addLeads(app, g);
      addLine(app, g, 18, 14, 0, 20, 2);
      addLine(app, g, 30, 14, 0, 20, 2);
      addCircle(app, g, MID, MID, 3, null, 1.4);
      break;
    case 'mov':
      drawResistor(app, g, 'mov');
      break;
    case 'testPoint':
      drawTestPoint(app, g);
      break;
    case 'probe':
    case 'scopeProbe':
      drawMeter(app, g, 'P');
      break;
    case 'ammeter':
      drawMeter(app, g, 'A');
      break;
    case 'voltmeter':
      drawMeter(app, g, 'V');
      break;
    case 'currentShunt':
      drawResistor(app, g, 'fixed');
      addText(app, g, 'SH', 18, 12, 7);
      break;
    case 'fan':
      drawFan(app, g);
      break;
    case 'heatsink':
      drawHeatsink(app, g);
      break;
    case 'connectorShield':
    case 'chassis':
    case 'enclosure':
      addBox(app, g, 8, 10, 32, 28, k === 'enclosure' ? 'ENC' : 'CHS');
      break;
    case 'mountingHole':
    case 'mountingPad':
      drawMountingHole(app, g);
      break;
    case 'netLabel':
      addBox(app, g, 8, 16, 32, 16, 'NET');
      break;
    case 'bus':
      addLine(app, g, 8, MID - 4, 32, 0, 3);
      addLine(app, g, 8, MID + 4, 32, 0, 3);
      break;
    case 'junction':
      drawJunction(app, g);
      break;
    case 'noConnect':
      drawNoConnect(app, g);
      break;
    case 'wire':
      drawWireStub(app, g);
      break;
    case 'shield':
      addBox(app, g, 10, 10, 28, 28);
      addLine(app, g, 14, 14, 20, 20, 1.4, muted());
      break;
    case 'offPageConnector':
    case 'sheetConnector':
      g.add(
        app.polygon({
          points: [8, MID, 20, 14, 40, 14, 40, 34, 20, 34],
          fill: getActiveDiagram().schematicFill,
          stroke: stroke(),
          strokeWidth: 1.7,
          listening: false,
        })
      );
      break;
    case 'harness':
    case 'cable':
      addLine(app, g, 8, MID - 4, 32, 0, 2);
      addLine(app, g, 8, MID, 32, 0, 2);
      addLine(app, g, 8, MID + 4, 32, 0, 2);
      break;
    case 'terminal':
    case 'pin':
      addCircle(app, g, MID, MID, 4, null, 2);
      addLine(app, g, 4, MID, 16, 0);
      break;
    default:
      drawResistor(app, g, 'fixed');
      break;
  }
}

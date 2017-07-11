
#define IN_BUFFER_SIZE 100
#define CHAN_NUM 8
#define RELAY_NUM 4
#define SWITCH_NUM 2
#define THERM_NUM 2
#define AUTO_TOPOFF_SWITCH 0
#define AUTO_TOPOFF_EMERGENCY_SWITCH 1
#define AUTO_TOPOFF 0

//Thermistor global
float R1 = 10000;
float logR2, R2, T;
float c1 = 1.009249522e-03, c2 = 2.378405444e-04, c3 = 2.019202697e-07;

//light channels
byte channel_pin[] = {9,2,6,4,8,5,7,3};
byte channel_brightness[] = {1,1,1,1,1,1,1,1};

byte relay_pin[] = {22,23,24,25};
byte relay_state[] = {1,1,1,1};

byte switch_pin[] = {52,53};

byte thermistor_pin[] = {A0,A1};

int brightness =0;
 char input_buffer[IN_BUFFER_SIZE];
 char *ip = input_buffer;

void setup() {
  // put your setup code here, to run once:


  for (int i=0; i< CHAN_NUM; i++){
    pinMode(channel_pin[i], OUTPUT);
    analogWrite(channel_pin[i],channel_brightness[i]);
  }
  for (int i=0; i< RELAY_NUM; i++) {
    pinMode(relay_pin[i], OUTPUT);
    digitalWrite(relay_pin[i],relay_state[i]);
  }
  for (int i=0;i<SWITCH_NUM;i++){
    pinMode(switch_pin[i], INPUT_PULLUP);
  }
for (int i=0;i<THERM_NUM;i++){
   pinMode(thermistor_pin[i], INPUT);
}
  
  Serial.begin(115200);
  Serial.print("Welcome fishy v1.0\n");

}

float get_thermistor_temperature( byte pin) {
  int Vo = analogRead(pin);
  R2 = R1 * (1023.0 / (float)Vo - 1.0);
  logR2 = log(R2);
  T = (1.0 / (c1 + c2*logR2 + c3*logR2*logR2*logR2));
  float Tc = T - 273.15;
  return Tc;
}
void process_string(char * instr) {
 char buffer[100];
 int chan =-1;
 int b = 0;
 int sw =0;
 int result =-1;
 float resultf =-1;
 
  switch(instr[0]) {
    case '+':
      for (int i=0; i< CHAN_NUM; i++) {
        if (channel_brightness[i] <= 250) channel_brightness[i]+=5;
        analogWrite(channel_pin[i],channel_brightness[i]);
      }
      sprintf(buffer,"Set Channel ALL +5\n");      
      break;
      case '-':
      for (int i=0; i< CHAN_NUM; i++) {
        if (channel_brightness[i] >= 5)  channel_brightness[i]-=5;
        analogWrite(channel_pin[i],channel_brightness[i]);
      }
      sprintf(buffer,"Set Channel ALL -5\n");      
      break;
    case '?':  
      sprintf(buffer,"C");      
      for (int i=0;i< CHAN_NUM; i++) {
        sprintf(buffer,"%s %d",buffer,channel_brightness[i]);
      }
      sprintf(buffer,"%s\nR",buffer);
      for (int i=0;i< RELAY_NUM; i++) {
        sprintf(buffer,"%s %d",buffer,relay_state[i]);
      }
      sprintf(buffer,"%s\nS",buffer);
      for (int i=0;i< SWITCH_NUM; i++) {
        sprintf(buffer,"%s %d",buffer,digitalRead(switch_pin[i]));
      }
      sprintf(buffer,"%s\nT",buffer);
      for (int i=0;i< THERM_NUM;i++){
       
        resultf = get_thermistor_temperature(thermistor_pin[i]);
        sprintf(buffer,"%s %d.%d",buffer,int(resultf),int(resultf*10)%10);
      }
      sprintf(buffer,"%s\n",buffer);
      break;
    case 'l':
      sscanf(instr,"l %d %d",&chan,&b);
      sprintf(buffer,"Set Channel %d %d\n",chan,b);
      channel_brightness[chan] = b; 
      analogWrite(channel_pin[chan],channel_brightness[chan]);
      break;
    case 's':
      sscanf(instr,"s %d",&sw);
      result = digitalRead(switch_pin[sw]);
      sprintf(buffer,"S %d %d\n",sw,result);      
      break;
    case 'r':
      sscanf(instr,"r %d %d",&chan,&b);
      relay_state[chan] = b;
      digitalWrite(relay_pin[chan],relay_state[chan]);
      sprintf(buffer,"R %d %d\n",chan,b);      
      break;
    case 't':
      sscanf(instr,"t %d",&chan);
      resultf = get_thermistor_temperature(thermistor_pin[chan]);
      sprintf(buffer,"T %d %d.%d\n",chan,int(resultf),int(resultf*10)%10);
      break;
    case 'P':
      sprintf(buffer,"Pong\n");
      break;
      
    default:
      sprintf(buffer,"Unknown Command %s\n",instr);
  }
  Serial.print(buffer);
}

void loop() {
  // put your main code here, to run repeatedly:
 
 if (Serial.available()) {
    // read the most recent byte (which will be from 0 to 255):
    *ip = Serial.read();
    if (*ip == '\n') { //end of string
      ip++;
      *ip = 0;  
      process_string(input_buffer);
      ip = input_buffer;
    } else {
      ip++;
    }
 }
 

 //Emergency stops
 //autotop off
 //if switch 2 is off then reset relay 0
 
 /*if ((digitalRead(switch_pin[AUTO_TOPOFF_EMERGENCY_SWITCH])==1) && (relay_state[AUTO_TOPOFF] != 1)) {
   relay_state[AUTO_TOPOFF] = 1;
   digitalWrite(relay_pin[AUTO_TOPOFF],1);
   Serial.print("Tripped Auto TOPOFF\n");
 }*/
 

}





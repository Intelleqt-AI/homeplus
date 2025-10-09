import { useState } from "react";
import { 
  Building,
  Home,
  Users,
  CheckCircle,
  Flame,
  Zap,
  Sun,
  Trash2,
  ArrowRight,
  ArrowLeft,
  X
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface SetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: SetupData) => void;
}

interface SetupData {
  propertyType: string;
  ownership: string;
  council: string;
  systems: string[];
}

const SetupWizard = ({ isOpen, onClose, onComplete }: SetupWizardProps) => {
  const [step, setStep] = useState(1);
  const [setupData, setSetupData] = useState<SetupData>({
    propertyType: '',
    ownership: '',
    council: '',
    systems: []
  });

  const propertyTypes = [
    { id: 'house', label: 'House', icon: Home },
    { id: 'flat', label: 'Flat/Apartment', icon: Building },
    { id: 'rental', label: 'Rental Property', icon: Users }
  ];

  const ownershipTypes = [
    { id: 'owner', label: 'Owner Occupier', description: 'I own and live in this property' },
    { id: 'tenant', label: 'Tenant', description: 'I rent this property' },
    { id: 'landlord', label: 'Landlord', description: 'I rent this property to others' }
  ];

  const ukCouncils = [
    'Birmingham City Council',
    'Leeds City Council',
    'Glasgow City Council',
    'Sheffield City Council',
    'Bradford Council',
    'Liverpool City Council',
    'Edinburgh City Council',
    'Manchester City Council',
    'Bristol City Council',
    'Cardiff Council'
  ];

  const propertySystems = [
    { id: 'gas-boiler', label: 'Gas Boiler', icon: Flame },
    { id: 'electric-heating', label: 'Electric Heating', icon: Zap },
    { id: 'solar-panels', label: 'Solar Panels', icon: Sun },
    { id: 'septic-tank', label: 'Septic Tank', icon: Building },
    { id: 'wood-burner', label: 'Wood Burner/Fireplace', icon: Flame },
    { id: 'garden', label: 'Garden/Outdoor Space', icon: Home }
  ];

  const handleSystemToggle = (systemId: string) => {
    setSetupData(prev => ({
      ...prev,
      systems: prev.systems.includes(systemId)
        ? prev.systems.filter(id => id !== systemId)
        : [...prev.systems, systemId]
    }));
  };

  const generateTasks = () => {
    let complianceTasks = 0;
    let maintenanceTasks = 0;

    // Base compliance tasks
    if (setupData.ownership === 'landlord') {
      complianceTasks += 4; // Gas safety, EICR, EPC, Smoke alarms
    } else {
      complianceTasks += 2; // EICR, EPC
    }

    // System-specific tasks
    if (setupData.systems.includes('gas-boiler')) {
      complianceTasks += 1; // Gas safety
      maintenanceTasks += 1; // Annual service
    }
    if (setupData.systems.includes('wood-burner')) {
      maintenanceTasks += 1; // Chimney sweep
    }
    if (setupData.systems.includes('garden')) {
      maintenanceTasks += 4; // Seasonal garden tasks
    }

    // Base maintenance
    maintenanceTasks += 4; // Gutters, windows, etc.

    return { complianceTasks, maintenanceTasks };
  };

  const handleComplete = () => {
    onComplete(setupData);
    onClose();
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Welcome to Home+</h2>
              <p className="text-gray-600">Let's set up your property management in just a few steps</p>
            </div>

            <div>
              <Label className="text-base font-medium">What type of property is this?</Label>
              <div className="grid grid-cols-1 gap-3 mt-3">
                {propertyTypes.map(type => {
                  const IconComponent = type.icon;
                  return (
                    <Card 
                      key={type.id}
                      className={`cursor-pointer transition-colors ${
                        setupData.propertyType === type.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSetupData(prev => ({ ...prev, propertyType: type.id }))}
                    >
                      <CardContent className="flex items-center gap-3 p-4">
                        <IconComponent className="w-6 h-6 text-gray-600" />
                        <span className="font-medium">{type.label}</span>
                        {setupData.propertyType === type.id && (
                          <CheckCircle className="w-5 h-5 text-blue-500 ml-auto" />
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium">What's your ownership status?</Label>
              <div className="grid grid-cols-1 gap-3 mt-3">
                {ownershipTypes.map(ownership => (
                  <Card 
                    key={ownership.id}
                    className={`cursor-pointer transition-colors ${
                      setupData.ownership === ownership.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSetupData(prev => ({ ...prev, ownership: ownership.id }))}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">{ownership.label}</h3>
                          <p className="text-sm text-gray-600 mt-1">{ownership.description}</p>
                        </div>
                        {setupData.ownership === ownership.id && (
                          <CheckCircle className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium">Your Local Council</Label>
              <p className="text-sm text-gray-600 mb-3">This helps us import bin collection schedules and local services</p>
              <Select value={setupData.council} onValueChange={(value) => setSetupData(prev => ({ ...prev, council: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your local council" />
                </SelectTrigger>
                <SelectContent>
                  {ukCouncils.map(council => (
                    <SelectItem key={council} value={council}>{council}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium">Property Systems</Label>
              <p className="text-sm text-gray-600 mb-4">Select what applies to your property:</p>
              
              <div className="grid grid-cols-2 gap-3">
                {propertySystems.map(system => {
                  const IconComponent = system.icon;
                  const isSelected = setupData.systems.includes(system.id);
                  
                  return (
                    <Card 
                      key={system.id}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleSystemToggle(system.id)}
                    >
                      <CardContent className="flex items-center gap-3 p-3">
                        <Checkbox checked={isSelected} />
                        <IconComponent className="w-5 h-5 text-gray-600" />
                        <span className="text-sm font-medium">{system.label}</span>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 5:
        const { complianceTasks, maintenanceTasks } = generateTasks();
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">You're All Set!</h2>
              <p className="text-gray-600">Based on your selections, we'll create your personalized calendar</p>
            </div>

            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-4">Your Home+ Calendar Will Include:</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{complianceTasks}</div>
                  <div className="text-sm text-blue-800">Compliance Tasks</div>
                  <div className="text-xs text-blue-600 mt-1">Gas safety, EICR, certificates</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{maintenanceTasks}</div>
                  <div className="text-sm text-green-800">Maintenance Reminders</div>
                  <div className="text-xs text-green-600 mt-1">Seasonal tasks, servicing</div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-blue-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-800">Bin day imports</span>
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-blue-800">Seasonal schedules</span>
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-blue-800">Trade recommendations</span>
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return setupData.propertyType !== '';
      case 2: return setupData.ownership !== '';
      case 3: return setupData.council !== '';
      case 4: return true; // Systems are optional
      case 5: return true;
      default: return false;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Property Setup</DialogTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Step {step} of 5</span>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </DialogHeader>

        <div className="py-6">
          {renderStep()}
        </div>

        <div className="flex justify-between pt-6 border-t">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <Button 
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleComplete} className="bg-blue-600 hover:bg-blue-700">
              Generate My Calendar
              <CheckCircle className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SetupWizard;
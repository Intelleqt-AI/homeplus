import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Wrench } from 'lucide-react';
import { Button } from '../ui/button';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { callEdgeFunction } from '@/lib/supabaseFunctions';

const Quote = ({ open, setOpen }) => {
  const { user } = useAuth();

  const [service, setService] = useState('Plumbing');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [priority, setPriority] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState('');
  const [answers, setAnswers] = useState<Record<string, any>>({});

  // Category configurations with questions
  const categoryConfig = [
    {
      category: 'Boilers',
      category_description: 'Central heating boilers and controls',
      questions: [
        {
          question_order: 1,
          question_text: 'What type of boiler is it?',
          question_type: 'multiple_choice',
          options: ['Combi', 'System', 'Conventional/Heat-only', 'Back boiler', 'Unknown'],
          required: true,
          output_key: 'boiler_type',
        },
        {
          question_order: 2,
          question_text: 'What needs doing to the boiler?',
          question_type: 'multiple_choice',
          options: ['Repair/diagnose', 'Service', 'Installation/replacement', 'Removal/relocation', 'Gas safety certificate'],
          required: true,
          output_key: 'boiler_action',
        },
        {
          question_order: 3,
          question_text: 'Is the boiler currently working?',
          question_type: 'multiple_choice',
          options: ['Not working', 'Intermittent', 'Working but faulty', 'N/A'],
          required: true,
          output_key: 'boiler_status',
        },
        {
          question_order: 4,
          question_text: 'Is the property domestic or commercial?',
          question_type: 'multiple_choice',
          options: ['Domestic', 'Commercial'],
          required: true,
          output_key: 'property_type',
        },
        {
          question_order: 5,
          question_text: 'When do you need the work completed?',
          question_type: 'multiple_choice',
          options: ['ASAP', 'Within a week', 'Within a month', 'Flexible/Just planning'],
          required: true,
          output_key: 'urgency',
        },
        {
          question_order: 6,
          question_text: 'Add a short description of the job (include any useful details).',
          question_type: 'text',
          options: [],
          required: false,
          output_key: 'description',
        },
      ],
    },
    {
      category: 'Radiators & heating',
      category_description: 'Radiator installs, leaks, balancing, TRVs',
      questions: [
        {
          question_order: 1,
          question_text: 'What do you need help with?',
          question_type: 'multiple_choice',
          options: ['Install new radiator', 'Move existing radiator', 'Repair leak', 'Cold radiators/balancing', 'Fit TRVs', 'Powerflush/system clean'],
          required: true,
          output_key: 'heating_action',
        },
        {
          question_order: 2,
          question_text: 'How many radiators are involved (approx.)?',
          question_type: 'number',
          options: [],
          required: false,
          output_key: 'radiator_count',
        },
        {
          question_order: 3,
          question_text: 'Is the property domestic or commercial?',
          question_type: 'multiple_choice',
          options: ['Domestic', 'Commercial'],
          required: true,
          output_key: 'property_type',
        },
        {
          question_order: 4,
          question_text: 'When do you need the work completed?',
          question_type: 'multiple_choice',
          options: ['ASAP', 'Within a week', 'Within a month', 'Flexible/Just planning'],
          required: true,
          output_key: 'urgency',
        },
        {
          question_order: 5,
          question_text: 'Add a short description of the job (include any useful details).',
          question_type: 'text',
          options: [],
          required: false,
          output_key: 'description',
        },
      ],
    },
    {
      category: 'Hot water cylinders',
      category_description: 'Vented/unvented cylinders, immersion heaters',
      questions: [
        {
          question_order: 1,
          question_text: 'What type of cylinder is it?',
          question_type: 'multiple_choice',
          options: ['Unvented (pressurised)', 'Vented', 'Unknown'],
          required: true,
          output_key: 'cylinder_type',
        },
        {
          question_order: 2,
          question_text: 'What work is needed?',
          question_type: 'multiple_choice',
          options: ['Repair/diagnose', 'Service (G3)', 'Installation/replacement', 'Immersion heater repair'],
          required: true,
          output_key: 'cylinder_action',
        },
        {
          question_order: 3,
          question_text: 'Is the property domestic or commercial?',
          question_type: 'multiple_choice',
          options: ['Domestic', 'Commercial'],
          required: true,
          output_key: 'property_type',
        },
        {
          question_order: 4,
          question_text: 'When do you need the work completed?',
          question_type: 'multiple_choice',
          options: ['ASAP', 'Within a week', 'Within a month', 'Flexible/Just planning'],
          required: true,
          output_key: 'urgency',
        },
        {
          question_order: 5,
          question_text: 'Add a short description of the job (include any useful details).',
          question_type: 'text',
          options: [],
          required: false,
          output_key: 'description',
        },
      ],
    },
    {
      category: 'Blocked drains & waste',
      category_description: 'Blockages in sinks, toilets, baths, external',
      questions: [
        {
          question_order: 1,
          question_text: 'Where is the blockage?',
          question_type: 'multiple_choice',
          options: ['Toilet', 'Sink', 'Bath/Shower', 'External gully', 'Unknown'],
          required: true,
          output_key: 'blockage_location',
        },
        {
          question_order: 2,
          question_text: 'Is water backing up / overflowing?',
          question_type: 'multiple_choice',
          options: ['Yes', 'No'],
          required: true,
          output_key: 'overflow',
        },
        {
          question_order: 3,
          question_text: 'Is the property domestic or commercial?',
          question_type: 'multiple_choice',
          options: ['Domestic', 'Commercial'],
          required: true,
          output_key: 'property_type',
        },
        {
          question_order: 4,
          question_text: 'When do you need the work completed?',
          question_type: 'multiple_choice',
          options: ['ASAP', 'Within a week', 'Within a month', 'Flexible/Just planning'],
          required: true,
          output_key: 'urgency',
        },
        {
          question_order: 5,
          question_text: 'Add a short description of the job (include any useful details).',
          question_type: 'text',
          options: [],
          required: false,
          output_key: 'description',
        },
      ],
    },
    {
      category: 'Thermostats & controls',
      category_description: 'Room stats, programmers, smart controls',
      questions: [
        {
          question_order: 1,
          question_text: 'Which control do you need help with?',
          question_type: 'multiple_choice',
          options: ['Room thermostat', 'Programmer/timer', 'Smart thermostat', 'Zone valves/actuators'],
          required: true,
          output_key: 'control_type',
        },
        {
          question_order: 2,
          question_text: 'Is this a new install or a fault with existing controls?',
          question_type: 'multiple_choice',
          options: ['New install', 'Fault with existing', 'Upgrade'],
          required: true,
          output_key: 'control_action',
        },
        {
          question_order: 3,
          question_text: 'Is the property domestic or commercial?',
          question_type: 'multiple_choice',
          options: ['Domestic', 'Commercial'],
          required: true,
          output_key: 'property_type',
        },
        {
          question_order: 4,
          question_text: 'When do you need the work completed?',
          question_type: 'multiple_choice',
          options: ['ASAP', 'Within a week', 'Within a month', 'Flexible/Just planning'],
          required: true,
          output_key: 'urgency',
        },
        {
          question_order: 5,
          question_text: 'Add a short description of the job (include any useful details).',
          question_type: 'text',
          options: [],
          required: false,
          output_key: 'description',
        },
      ],
    },
    {
      category: 'Pipework, taps & drainage',
      category_description: 'Leaks, alterations, new pipe runs',
      questions: [
        {
          question_order: 1,
          question_text: 'What best describes the job?',
          question_type: 'multiple_choice',
          options: ['Leak repair', 'New/altered pipe run', 'Replace tap/valve', 'Waste/overflow issue'],
          required: true,
          output_key: 'pipe_action',
        },
        {
          question_order: 2,
          question_text: 'Is the leak/issue active right now?',
          question_type: 'multiple_choice',
          options: ['Yes (urgent)', 'Intermittent', 'No (preventative)'],
          required: true,
          output_key: 'issue_status',
        },
        {
          question_order: 3,
          question_text: 'Is the property domestic or commercial?',
          question_type: 'multiple_choice',
          options: ['Domestic', 'Commercial'],
          required: true,
          output_key: 'property_type',
        },
        {
          question_order: 4,
          question_text: 'When do you need the work completed?',
          question_type: 'multiple_choice',
          options: ['ASAP', 'Within a week', 'Within a month', 'Flexible/Just planning'],
          required: true,
          output_key: 'urgency',
        },
        {
          question_order: 5,
          question_text: 'Add a short description of the job (include any useful details).',
          question_type: 'text',
          options: [],
          required: false,
          output_key: 'description',
        },
      ],
    },
    {
      category: 'Bathroom installation',
      category_description: 'Full/partial bathroom refits',
      questions: [
        {
          question_order: 1,
          question_text: 'What scope of bathroom work?',
          question_type: 'multiple_choice',
          options: ['Full refit', 'Partial refurb', 'Single fixture change'],
          required: true,
          output_key: 'bathroom_scope',
        },
        {
          question_order: 2,
          question_text: 'Do you have designs and materials selected?',
          question_type: 'multiple_choice',
          options: ['Yes (ready to go)', 'Some selected', 'Not yet'],
          required: false,
          output_key: 'materials_ready',
        },
        {
          question_order: 3,
          question_text: 'Is the property domestic or commercial?',
          question_type: 'multiple_choice',
          options: ['Domestic', 'Commercial'],
          required: true,
          output_key: 'property_type',
        },
        {
          question_order: 4,
          question_text: 'When do you need the work completed?',
          question_type: 'multiple_choice',
          options: ['ASAP', 'Within a week', 'Within a month', 'Flexible/Just planning'],
          required: true,
          output_key: 'urgency',
        },
        {
          question_order: 5,
          question_text: 'Add a short description of the job (include any useful details).',
          question_type: 'text',
          options: [],
          required: false,
          output_key: 'description',
        },
      ],
    },
    {
      category: 'Shower installation/repair',
      category_description: 'Electric, mixer, thermostatic, enclosures',
      questions: [
        {
          question_order: 1,
          question_text: 'What type of shower?',
          question_type: 'multiple_choice',
          options: ['Electric', 'Mixer/Thermostatic', 'Power shower', 'Digital', 'Unknown'],
          required: true,
          output_key: 'shower_type',
        },
        {
          question_order: 2,
          question_text: 'Is this a new install or a repair?',
          question_type: 'multiple_choice',
          options: ['New install', 'Replacement', 'Repair/diagnose', 'Enclosure/tray work'],
          required: true,
          output_key: 'shower_action',
        },
        {
          question_order: 3,
          question_text: 'Is the property domestic or commercial?',
          question_type: 'multiple_choice',
          options: ['Domestic', 'Commercial'],
          required: true,
          output_key: 'property_type',
        },
        {
          question_order: 4,
          question_text: 'When do you need the work completed?',
          question_type: 'multiple_choice',
          options: ['ASAP', 'Within a week', 'Within a month', 'Flexible/Just planning'],
          required: true,
          output_key: 'urgency',
        },
        {
          question_order: 5,
          question_text: 'Add a short description of the job (include any useful details).',
          question_type: 'text',
          options: [],
          required: false,
          output_key: 'description',
        },
      ],
    },
    {
      category: 'Toilet installation/repair',
      category_description: 'Cisterns, flush valves, pans',
      questions: [
        {
          question_order: 1,
          question_text: 'What type of toilet?',
          question_type: 'multiple_choice',
          options: ['Close-coupled', 'Back-to-wall', 'Wall-hung', 'Saniflo/Macerator', 'Unknown'],
          required: true,
          output_key: 'toilet_type',
        },
        {
          question_order: 2,
          question_text: 'What work is needed?',
          question_type: 'multiple_choice',
          options: ['Install/replace', 'Repair flush/valves', 'Unblock/Fix leak'],
          required: true,
          output_key: 'toilet_action',
        },
        {
          question_order: 3,
          question_text: 'Is the property domestic or commercial?',
          question_type: 'multiple_choice',
          options: ['Domestic', 'Commercial'],
          required: true,
          output_key: 'property_type',
        },
        {
          question_order: 4,
          question_text: 'When do you need the work completed?',
          question_type: 'multiple_choice',
          options: ['ASAP', 'Within a week', 'Within a month', 'Flexible/Just planning'],
          required: true,
          output_key: 'urgency',
        },
        {
          question_order: 5,
          question_text: 'Add a short description of the job (include any useful details).',
          question_type: 'text',
          options: [],
          required: false,
          output_key: 'description',
        },
      ],
    },
    {
      category: "Tap installation/repair",
      category_description: "Kitchen/bathroom taps, cartridges",
      questions: [
        {
          question_order: 1,
          question_text: "What type of tap?",
          question_type: "multiple_choice",
          options: ["Kitchen mixer", "Bath mixer", "Basin mono", "Wall-mounted", "Other/Unknown"],
          required: false,
          output_key: "tap_type"
        },
        {
          question_order: 2,
          question_text: "What work is needed?",
          question_type: "multiple_choice",
          options: ["Install/replace", "Repair cartridge/washer", "Fix drip/leak"],
          required: true,
          output_key: "tap_action"
        },
        {
          question_order: 3,
          question_text: "Is the property domestic or commercial?",
          question_type: "multiple_choice",
          options: ["Domestic", "Commercial"],
          required: true,
          output_key: "property_type"
        },
        {
          question_order: 4,
          question_text: "When do you need the work completed?",
          question_type: "multiple_choice",
          options: ["ASAP", "Within a week", "Within a month", "Flexible/Just planning"],
          required: true,
          output_key: "urgency"
        },
        {
          question_order: 5,
          question_text: "Add a short description of the job (include any useful details).",
          question_type: "text",
          options: [],
          required: false,
          output_key: "description"
        }
  ]
},

{
  category: "Sink installation/repair",
  category_description: "Kitchen/utility/bathroom sinks",
  questions: [
    {
      question_order: 1,
      question_text: "Which room is the sink in?",
      question_type: "multiple_choice",
      options: ["Kitchen", "Utility", "Bathroom", "Cloakroom", "Other"],
      required: false,
      output_key: "sink_room"
    },
    {
      question_order: 2,
      question_text: "What work is needed?",
      question_type: "multiple_choice",
      options: ["Install/replace", "Unblock/slow drain", "Fix leak", "Fit waste/disposal"],
      required: true,
      output_key: "sink_action"
    },
    {
      question_order: 3,
      question_text: "Is the property domestic or commercial?",
      question_type: "multiple_choice",
      options: ["Domestic", "Commercial"],
      required: true,
      output_key: "property_type"
    },
    {
      question_order: 4,
      question_text: "When do you need the work completed?",
      question_type: "multiple_choice",
      options: ["ASAP", "Within a week", "Within a month", "Flexible/Just planning"],
      required: true,
      output_key: "urgency"
    },
    {
      question_order: 5,
      question_text: "Add a short description of the job (include any useful details).",
      question_type: "text",
      options: [],
      required: false,
      output_key: "description"
    }
  ]
},

{
  category: "Bath installation/repair",
  category_description: "Baths, wastes, seals, panels",
  questions: [
    {
      question_order: 1,
      question_text: "What type of bath?",
      question_type: "multiple_choice",
      options: ["Standard", "Shower-bath", "Freestanding", "Whirlpool", "Other/Unknown"],
      required: false,
      output_key: "bath_type"
    },
    {
      question_order: 2,
      question_text: "What work is needed?",
      question_type: "multiple_choice",
      options: ["Install/replace", "Seal/repair", "Fix waste/overflow"],
      required: true,
      output_key: "bath_action"
    },
    {
      question_order: 3,
      question_text: "Is the property domestic or commercial?",
      question_type: "multiple_choice",
      options: ["Domestic", "Commercial"],
      required: true,
      output_key: "property_type"
    },
    {
      question_order: 4,
      question_text: "When do you need the work completed?",
      question_type: "multiple_choice",
      options: ["ASAP", "Within a week", "Within a month", "Flexible/Just planning"],
      required: true,
      output_key: "urgency"
    },
    {
      question_order: 5,
      question_text: "Add a short description of the job (include any useful details).",
      question_type: "text",
      options: [],
      required: false,
      output_key: "description"
    }
  ]
},

{
  category: "Kitchen plumbing",
  category_description: "Sinks, wastes, traps, minor alterations",
  questions: [
    {
      question_order: 1,
      question_text: "What best describes the job?",
      question_type: "multiple_choice",
      options: ["New sink/tap", "Alter pipework for kitchen fit", "Waste/trap issue", "Leak repair"],
      required: true,
      output_key: "kitchen_action"
    },
    {
      question_order: 2,
      question_text: "Is the kitchen currently being refitted?",
      question_type: "multiple_choice",
      options: ["Yes", "No", "Planning stage"],
      required: false,
      output_key: "kitchen_refit"
    },
    {
      question_order: 3,
      question_text: "Is the property domestic or commercial?",
      question_type: "multiple_choice",
      options: ["Domestic", "Commercial"],
      required: true,
      output_key: "property_type"
    },
    {
      question_order: 4,
      question_text: "When do you need the work completed?",
      question_type: "multiple_choice",
      options: ["ASAP", "Within a week", "Within a month", "Flexible/Just planning"],
      required: true,
      output_key: "urgency"
    },
    {
      question_order: 5,
      question_text: "Add a short description of the job (include any useful details).",
      question_type: "text",
      options: [],
      required: false,
      output_key: "description"
    }
  ]
},

{
  category: "Appliances",
  category_description: "Dishwasher, washing machine, fridge/freezer plumbing",
  questions: [
    {
      question_order: 1,
      question_text: "Which appliance?",
      question_type: "multiple_choice",
      options: ["Dishwasher", "Washing machine", "Fridge/freezer (water/ice)", "Tumble dryer condenser", "Other"],
      required: true,
      output_key: "appliance_type"
    },
    {
      question_order: 2,
      question_text: "What do you need?",
      question_type: "multiple_choice",
      options: ["New install", "Replacement like-for-like", "Fault diagnosis/repair", "Disconnect/remove"],
      required: true,
      output_key: "appliance_action"
    },
    {
      question_order: 3,
      question_text: "Is the property domestic or commercial?",
      question_type: "multiple_choice",
      options: ["Domestic", "Commercial"],
      required: true,
      output_key: "property_type"
    },
    {
      question_order: 4,
      question_text: "When do you need the work completed?",
      question_type: "multiple_choice",
      options: ["ASAP", "Within a week", "Within a month", "Flexible/Just planning"],
      required: true,
      output_key: "urgency"
    },
    {
      question_order: 5,
      question_text: "Add a short description of the job (include any useful details).",
      question_type: "text",
      options: [],
      required: false,
      output_key: "description"
    }
  ]
},

{
  category: "Outside taps",
  category_description: "New outdoor taps, repairs, isolation",
  questions: [
    {
      question_order: 1,
      question_text: "Is this a new outside tap or a repair?",
      question_type: "multiple_choice",
      options: ["New install", "Repair/replace existing", "Winterisation"],
      required: true,
      output_key: "outside_tap_action"
    },
    {
      question_order: 2,
      question_text: "Where will the tap be located?",
      question_type: "multiple_choice",
      options: ["Back garden", "Front garden", "Garage/Outbuilding", "Other"],
      required: false,
      output_key: "outside_tap_location"
    },
    {
      question_order: 3,
      question_text: "Is the property domestic or commercial?",
      question_type: "multiple_choice",
      options: ["Domestic", "Commercial"],
      required: true,
      output_key: "property_type"
    },
    {
      question_order: 4,
      question_text: "When do you need the work completed?",
      question_type: "multiple_choice",
      options: ["ASAP", "Within a week", "Within a month", "Flexible/Just planning"],
      required: true,
      output_key: "urgency"
    },
    {
      question_order: 5,
      question_text: "Add a short description of the job (include any useful details).",
      question_type: "text",
      options: [],
      required: false,
      output_key: "description"
    }
  ]
},

{
  category: "Water tanks & cisterns",
  category_description: "Loft/header tanks, ball valves",
  questions: [
    {
      question_order: 1,
      question_text: "What type of tank/cistern?",
      question_type: "multiple_choice",
      options: ["Loft/header tank", "WC cistern", "Feed & expansion", "Other/Unknown"],
      required: true,
      output_key: "tank_type"
    },
    {
      question_order: 2,
      question_text: "What work is needed?",
      question_type: "multiple_choice",
      options: ["Install/replace", "Repair ball valve/float", "Stop overflow", "Leak repair"],
      required: true,
      output_key: "tank_action"
    },
    {
      question_order: 3,
      question_text: "Is the property domestic or commercial?",
      question_type: "multiple_choice",
      options: ["Domestic", "Commercial"],
      required: true,
      output_key: "property_type"
    },
    {
      question_order: 4,
      question_text: "When do you need the work completed?",
      question_type: "multiple_choice",
      options: ["ASAP", "Within a week", "Within a month", "Flexible/Just planning"],
      required: true,
      output_key: "urgency"
    },
    {
      question_order: 5,
      question_text: "Add a short description of the job (include any useful details).",
      question_type: "text",
      options: [],
      required: false,
      output_key: "description"
    }
  ]
},

{
  category: "Macerators (Saniflo)",
  category_description: "Installation, repair, replacement",
  questions: [
    {
      question_order: 1,
      question_text: "Is this a new macerator or a fault with an existing one?",
      question_type: "multiple_choice",
      options: ["New install", "Replacement", "Repair/diagnose"],
      required: true,
      output_key: "macerator_action"
    },
    {
      question_order: 2,
      question_text: "Which fixtures does it serve?",
      question_type: "multiple_choice",
      options: ["Toilet", "Toilet + basin", "Toilet + basin + shower", "Kitchen sink", "Other"],
      required: false,
      output_key: "macerator_fixtures"
    },
    {
      question_order: 3,
      question_text: "Is the property domestic or commercial?",
      question_type: "multiple_choice",
      options: ["Domestic", "Commercial"],
      required: true,
      output_key: "property_type"
    },
    {
      question_order: 4,
      question_text: "When do you need the work completed?",
      question_type: "multiple_choice",
      options: ["ASAP", "Within a week", "Within a month", "Flexible/Just planning"],
      required: true,
      output_key: "urgency"
    },
    {
      question_order: 5,
      question_text: "Add a short description of the job (include any useful details).",
      question_type: "text",
      options: [],
      required: false,
      output_key: "description"
    }
  ]
},
{
  category: "Pumps & boosters",
  category_description: "Shower pumps, whole-house boosters",
  questions: [
    {
      question_order: 1,
      question_text: "What type of pump/booster?",
      question_type: "multiple_choice",
      options: ["Shower pump", "Whole-house booster", "Recirculation pump", "Other/Unknown"],
      required: true,
      output_key: "pump_type"
    },
    {
      question_order: 2,
      question_text: "What work is needed?",
      question_type: "multiple_choice",
      options: ["New install", "Replacement", "Repair/diagnose", "Noise/vibration issue"],
      required: true,
      output_key: "pump_action"
    },
    {
      question_order: 3,
      question_text: "Is the property domestic or commercial?",
      question_type: "multiple_choice",
      options: ["Domestic", "Commercial"],
      required: true,
      output_key: "property_type"
    },
    {
      question_order: 4,
      question_text: "When do you need the work completed?",
      question_type: "multiple_choice",
      options: ["ASAP", "Within a week", "Within a month", "Flexible/Just planning"],
      required: true,
      output_key: "urgency"
    },
    {
      question_order: 5,
      question_text: "Add a short description of the job (include any useful details).",
      question_type: "text",
      options: [],
      required: false,
      output_key: "description"
    }
  ]
},
{
  category: "Water softeners/filters",
  category_description: "Install/repair/replace",
  questions: [
    {
      question_order: 1,
      question_text: "Which system do you need help with?",
      question_type: "multiple_choice",
      options: ["Water softener", "Scale reducer", "Drinking water filter", "Other"],
      required: true,
      output_key: "treatment_type"
    },
    {
      question_order: 2,
      question_text: "What work is needed?",
      question_type: "multiple_choice",
      options: ["New install", "Replacement", "Service/repair", "Cartridge change"],
      required: true,
      output_key: "treatment_action"
    },
    {
      question_order: 3,
      question_text: "Is the property domestic or commercial?",
      question_type: "multiple_choice",
      options: ["Domestic", "Commercial"],
      required: true,
      output_key: "property_type"
    },
    {
      question_order: 4,
      question_text: "When do you need the work completed?",
      question_type: "multiple_choice",
      options: ["ASAP", "Within a week", "Within a month", "Flexible/Just planning"],
      required: true,
      output_key: "urgency"
    },
    {
      question_order: 5,
      question_text: "Add a short description of the job (include any useful details).",
      question_type: "text",
      options: [],
      required: false,
      output_key: "description"
    }
  ]
},
{
  trade: "Plumbing",
  category: "Underfloor heating (wet)",
  category_description: "Manifolds, loops, diagnostics",
  questions: [
    {
      question_order: 1,
      question_text: "What do you need help with?",
      question_type: "multiple_choice",
      options: [
        "New install",
        "Manifold issue",
        "Cold zone/loop",
        "Control/thermostat issue",
        "Airlock/pressure issue"
      ],
      required: true,
      output_key: "ufh_action"
    },
    {
      question_order: 2,
      question_text: "How many zones are affected?",
      question_type: "number",
      required: false,
      output_key: "ufh_zones"
    },
    {
      question_order: 3,
      question_text: "Is the property domestic or commercial?",
      question_type: "multiple_choice",
      options: ["Domestic", "Commercial"],
      required: true,
      output_key: "property_type"
    },
    {
      question_order: 4,
      question_text: "When do you need the work completed?",
      question_type: "multiple_choice",
      options: ["ASAP", "Within a week", "Within a month", "Flexible/Just planning"],
      required: true,
      output_key: "urgency"
    },
    {
      question_order: 5,
      question_text: "Add a short description of the job (include any useful details).",
      question_type: "text",
      options: [],
      required: false,
      output_key: "description"
    }
  ]
},

{
  category: "Leak detection (trace & access)",
  category_description: "Non-invasive tracing and reports",
  questions: [
    {
      question_order: 1,
      question_text: "Where is the suspected leak?",
      question_type: "multiple_choice",
      options: ["Central heating", "Hot water", "Cold water", "Unknown"],
      required: true,
      output_key: "leak_area"
    },
    {
      question_order: 2,
      question_text: "Do you require a written report for insurance?",
      question_type: "multiple_choice",
      options: ["Yes", "No", "Not sure"],
      required: false,
      output_key: "insurance_report"
    },
    {
      question_order: 3,
      question_text: "Is the property domestic or commercial?",
      question_type: "multiple_choice",
      options: ["Domestic", "Commercial"],
      required: true,
      output_key: "property_type"
    },
    {
      question_order: 4,
      question_text: "When do you need the work completed?",
      question_type: "multiple_choice",
      options: ["ASAP", "Within a week", "Within a month", "Flexible/Just planning"],
      required: true,
      output_key: "urgency"
    },
    {
      question_order: 5,
      question_text: "Add a short description of the job (include any useful details).",
      question_type: "text",
      options: [],
      required: false,
      output_key: "description"
    }
  ]
},

{
  category: "Water pressure issues",
  category_description: "Low/high pressure, PRVs, boosters",
  questions: [
    {
      question_order: 1,
      question_text: "Is the pressure issue hot, cold or both?",
      question_type: "multiple_choice",
      options: ["Hot only", "Cold only", "Both", "Intermittent/Unknown"],
      required: true,
      output_key: "pressure_line"
    },
    {
      question_order: 2,
      question_text: "Where is the issue noticed?",
      question_type: "multiple_choice",
      options: ["Whole house", "Single room", "Single outlet"],
      required: false,
      output_key: "pressure_scope"
    },
    {
      question_order: 3,
      question_text: "Is the property domestic or commercial?",
      question_type: "multiple_choice",
      options: ["Domestic", "Commercial"],
      required: true,
      output_key: "property_type"
    },
    {
      question_order: 4,
      question_text: "When do you need the work completed?",
      question_type: "multiple_choice",
      options: ["ASAP", "Within a week", "Within a month", "Flexible/Just planning"],
      required: true,
      output_key: "urgency"
    },
    {
      question_order: 5,
      question_text: "Add a short description of the job (include any useful details).",
      question_type: "text",
      options: [],
      required: false,
      output_key: "description"
    }
  ]
},

{
  category: "Stopcock & mains supply",
  category_description: "Seized/failed stopcocks, mains issues",
  questions: [
    {
      question_order: 1,
      question_text: "What is the issue with the stopcock/mains?",
      question_type: "multiple_choice",
      options: [
        "Seized/doesn't turn",
        "Leaking",
        "Needs relocation/upgrade",
        "Cannot locate main stop tap"
      ],
      required: true,
      output_key: "stopcock_issue"
    },
    {
      question_order: 2,
      question_text: "Can you isolate the water supply at present?",
      question_type: "multiple_choice",
      options: ["Yes", "No", "Not sure"],
      required: false,
      output_key: "isolation_status"
    },
    {
      question_order: 3,
      question_text: "Is the property domestic or commercial?",
      question_type: "multiple_choice",
      options: ["Domestic", "Commercial"],
      required: true,
      output_key: "property_type"
    },
    {
      question_order: 4,
      question_text: "When do you need the work completed?",
      question_type: "multiple_choice",
      options: ["ASAP", "Within a week", "Within a month", "Flexible/Just planning"],
      required: true,
      output_key: "urgency"
    },
    {
      question_order: 5,
      question_text: "Add a short description of the job (include any useful details).",
      question_type: "text",
      options: [],
      required: false,
      output_key: "description"
    }
  ]
}
  ];

  const plumbingCategories = categoryConfig.map((c) => c.category);

  // Get selected category configuration
  const selectedCategoryConfig = categoryConfig.find((c) => c.category === category);

  // Handle answer change
  const handleAnswerChange = (outputKey: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [outputKey]: value,
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const data = await callEdgeFunction('receive-job', {
        method: 'POST',
        body: {
          name: user?.user_metadata?.full_name,
          email: user?.email,
          phone: user?.phone,
          service,
          category: category || undefined,
          location: location,
          value: budget,
          priority,
          homeID: user?.id,
          answers: answers,
        },
      });
      if (data.success) {
        toast.success('Job posted successfully!');
        setOpen(false);
      } else {
        toast.error('Error posting job: ' + (data.error || JSON.stringify(data)));
      }
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? (err as { message?: string }).message : String(err);
      toast.error('Network error: ' + msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-scroll">
        <DialogHeader>
          <DialogTitle>Get Quotes</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Service Required</label>
            <select 
              value={service}
              onChange={(e) => {
                setService(e.target.value);
                setCategory(''); // Reset category when service changes
              }}
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Plumbing">Plumbing</option>
              <option value="Electrical">Electrical</option>
              <option value="Heating">Heating</option>
              <option value="Gardening">Gardening</option>
              <option value="Cleaning">Cleaning</option>
              <option value="Other">Other</option>
            </select>
          </div>
          {service === 'Plumbing' && (
            <div>
              <label className="text-sm font-medium text-gray-600">Category</label>
              <select 
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setAnswers({}); // Reset answers when category changes
                }}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select a category</option>
                {plumbingCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              
              {/* Dynamic Questions Based on Category */}
              {selectedCategoryConfig && (
                <div className="mt-3">
                  <p className="text-sm text-gray-500 italic mb-4">
                    {selectedCategoryConfig.category_description}
                  </p>
                  
                  <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700">Additional Details</h4>
                    
                    {selectedCategoryConfig.questions
                      .sort((a, b) => a.question_order - b.question_order)
                      .map((question) => (
                        <div key={question.output_key}>
                          <label className="text-xs font-medium text-gray-600">
                            {question.question_text}
                            {question.required && <span className="text-red-600 ml-1">*</span>}
                          </label>
                          
                          {question.question_type === 'multiple_choice' && (
                            <select
                              value={answers[question.output_key] || ''}
                              onChange={(e) => handleAnswerChange(question.output_key, e.target.value)}
                              className="w-full mt-1 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                              required={question.required}
                            >
                              <option value="">Select an option</option>
                              {question.options.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          )}
                          
                          {question.question_type === 'text' && (
                            <textarea
                              value={answers[question.output_key] || ''}
                              onChange={(e) => handleAnswerChange(question.output_key, e.target.value)}
                              placeholder="Enter details here..."
                              className="w-full mt-1 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                              rows={3}
                              required={question.required}
                            />
                          )}
                          
                          {question.question_type === 'number' && (
                            <input
                              type="number"
                              value={answers[question.output_key] || ''}
                              onChange={(e) => handleAnswerChange(question.output_key, e.target.value)}
                              placeholder="Enter number"
                              className="w-full mt-1 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                              required={question.required}
                            />
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-gray-600">
              Post Code <span className="text-red-600">*</span>
            </label>
            <input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Enter your location postal code . eg: 3436"
              type="text"
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">
                Budget Range <span className="text-red-600">*</span>
              </label>
              <input
                value={budget}
                onChange={e => setBudget(e.target.value)}
                placeholder="e.g. 200 or £100-250"
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value={'low'}>Low</option>
                <option value={'medium'}>Medium</option>
                <option value={'high'}>High</option>
              </select>
            </div>
          </div>
          <div className="flex space-x-3 pt-4">
            <Button onClick={handleSubmit} className="flex-1" disabled={loading}>
              {loading ? 'Posting…' : 'Post Job'}
            </Button>
            <Button variant="outline" className="flex-1 bg-black text-white hover:bg-black hover:text-white" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Quote;

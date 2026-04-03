"use client";

import React from "react";
import { 
  Shield, 
  Activity, 
  Code, 
  Zap, 
  Globe, 
  Server, 
  Database, 
  Layers, 
  Lock, 
  CheckCircle2, 
  Rocket, 
  Clock 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const iconMap = {
  "Shield": Shield,
  "Activity": Activity,
  "Code": Code,
  "Zap": Zap,
  "Globe": Globe,
  "Server": Server,
  "Database": Database,
  "Layers": Layers,
  "Lock": Lock,
  "CheckCircle2": CheckCircle2,
  "Rocket": Rocket,
  "Clock": Clock
};

export default function Timeline({ data }) {
  if (!data) return null;

  return (
    <div className="space-y-12">
      {data.map((day, dayIndex) => (
        <div key={dayIndex} className="relative">
          {/* Day Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-linear-to-br from-purple-600 to-blue-600 p-3 rounded-2xl shadow-lg shadow-purple-200">
               <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{day.title}</h3>
              <p className="text-gray-500 font-medium">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
          </div>

          {/* Timeline Line */}
          <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-linear-to-b from-purple-200 via-blue-100 to-transparent hidden md:block"></div>

          {/* Milestones */}
          <div className="space-y-8 md:ml-12">
            {day.milestones.map((milestone, mIndex) => {
              const Icon = iconMap[milestone.icon] || Zap;
              
              return (
                <div key={mIndex} className="relative flex flex-col md:flex-row gap-4 group">
                  {/* Dot for Desktop */}
                  <div className="absolute -left-[3.4rem] top-4 w-4 h-4 rounded-full border-4 border-white bg-blue-500 shadow-sm hidden md:block group-hover:scale-125 transition-transform"></div>
                  
                  {/* Time Badge */}
                  <div className="md:w-32 pt-2">
                    <Badge variant="outline" className="bg-white/50 backdrop-blur-sm border-blue-100 text-blue-600 font-mono text-xs">
                      {milestone.time}
                    </Badge>
                  </div>

                  {/* Content Card */}
                  <Card className="flex-1 overflow-hidden border-none shadow-sm bg-white/40 backdrop-blur-md hover:shadow-md transition-all duration-300 group-hover:bg-white/60">
                    <CardContent className="p-5 flex gap-4">
                      <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-xl bg-linear-to-br from-gray-50 to-white border border-gray-100 group-hover:from-purple-50 group-hover:to-blue-50 transition-colors">
                        <Icon className="w-6 h-6 text-gray-400 group-hover:text-purple-600 transition-colors" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800 text-lg group-hover:text-purple-700 transition-colors">
                          {milestone.label}
                        </h4>
                        <p className="text-gray-600 mt-1 leading-relaxed">
                          {milestone.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

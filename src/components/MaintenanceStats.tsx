const MaintenanceStats = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container">
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-center mb-12 text-foreground">
          Stop losing money on your biggest investment
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="text-center bg-muted/50 p-8 rounded-lg">
            <div className="mb-2">
              <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                ANNUAL WASTE
              </span>
            </div>
            <div className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              £3,400
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Average UK homeowner loss from missed maintenance yearly
            </p>
          </div>
          
          <div className="text-center bg-muted/50 p-8 rounded-lg">
            <div className="mb-2">
              <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                EMERGENCY RATE
              </span>
            </div>
            <div className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              3X MORE
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              What you pay when calling trades in an emergency
            </p>
          </div>
          
          <div className="text-center bg-muted/50 p-8 rounded-lg">
            <div className="mb-2">
              <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                VALUE AT RISK
              </span>
            </div>
            <div className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              £15,000
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Potential value loss from poor maintenance history when selling
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MaintenanceStats;
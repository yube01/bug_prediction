import { Link } from 'react-router-dom'
import { Activity, ShieldCheck, Zap, ArrowRight, ChevronRight, CheckCircle2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../components/ui/accordion'
import Navbar from '../components/website/Navbar'

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-bg selection:bg-primary/30 selection:text-primary-text flex flex-col font-body">
            <Navbar />

            {/* Hero Section */}
            <main className="flex-1 flex flex-col items-center justify-center relative overflow-hidden px-6 pt-20 pb-32">
                {/* Background effects */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 blur-[120px] rounded-full pointer-events-none opacity-50 mix-blend-screen" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-info/10 blur-[100px] rounded-full pointer-events-none opacity-50 mix-blend-screen" />

                <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">


                    <h1 className="heading-1 tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-fg via-fg to-fg-tertiary animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-150">
                        Catch bugs before <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-accent">
                            they merge.
                        </span>
                    </h1>

                    <p className="text-xl text-fg-secondary max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                        Analyze your GitHub commits for risk factors like high churn and cyclomatic complexity. Spot the bad code before it hits production.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
                        <Link to="/predict">
                            <Button className="rounded-full bg-primary hover:bg-primary-hover text-black h-14 px-8 text-base shadow-[0_0_40px_-10px_var(--color-primary)] transition-all hover:shadow-[0_0_60px_-10px_var(--color-primary)] hover:scale-105">
                                Start Predicting Now <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </Link>
                        <Link to="/explore">
                            <Button variant="outline" className="rounded-full h-14 px-8 text-base border-border bg-fill1/50 backdrop-blur-sm hover:bg-fill2 transition-all hover:scale-105 group">
                                View Explorer <ChevronRight className="ml-2 w-5 h-5 text-fg-secondary group-hover:text-fg transition-colors" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </main>

            {/* Stats Section */}
            <section className="py-12 border-y border-border/50 bg-fill1/20 relative z-10">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-border/0 md:divide-border/50">
                        <div className="p-4">
                            <div className="text-4xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-info mb-2">10x</div>
                            <div className="text-sm text-fg-secondary font-medium tracking-wide">Faster Code Reviews</div>
                        </div>
                        <div className="p-4">
                            <div className="text-4xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-info mb-2">30%</div>
                            <div className="text-sm text-fg-secondary font-medium tracking-wide">Less Debugging Time</div>
                        </div>
                        <div className="p-4 hidden md:block">
                            <div className="text-4xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-info mb-2">100+</div>
                            <div className="text-sm text-fg-secondary font-medium tracking-wide">Risk Factors Checked</div>
                        </div>
                        <div className="p-4 hidden md:block">
                            <div className="text-4xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-info mb-2">24/7</div>
                            <div className="text-sm text-fg-secondary font-medium tracking-wide">Automated Protection</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 bg-fill1/30 border-t border-border/50 relative">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="heading-2 text-fg mb-4">Why use Predictor?</h2>
                        <p className="text-fg-secondary max-w-2xl mx-auto text-lg">
                            Stop guessing during code reviews. We give you hard data on which commits are most likely to break things.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="p-8 rounded-3xl bg-fill2/50 border border-border backdrop-blur-sm hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 group hover:-translate-y-1">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Activity className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-semibold font-heading text-fg mb-3">Spot risky commits</h3>
                            <p className="text-fg-secondary leading-relaxed">
                                We analyze your code changes instantly so you don't push broken code to production.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="p-8 rounded-3xl bg-fill2/50 border border-border backdrop-blur-sm hover:border-info/50 transition-all duration-300 hover:shadow-lg hover:shadow-info/5 group hover:-translate-y-1">
                            <div className="w-12 h-12 rounded-xl bg-info/10 text-info flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-semibold font-heading text-fg mb-3">Works with GitHub</h3>
                            <p className="text-fg-secondary leading-relaxed">
                                Paste a repo link and we'll pull your recent commits and analyze the entire branch in seconds.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="p-8 rounded-3xl bg-fill2/50 border border-border backdrop-blur-sm hover:border-success/50 transition-all duration-300 hover:shadow-lg hover:shadow-success/5 group hover:-translate-y-1">
                            <div className="w-12 h-12 rounded-xl bg-success/10 text-success flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Zap className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-semibold font-heading text-fg mb-3">Know why it failed</h3>
                            <p className="text-fg-secondary leading-relaxed">
                                See exactly what makes a commit dangerous—whether it's high churn, complex logic, or missing tests.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Metrics Breakdown Section (NEW) */}
            <section className="py-24 bg-bg relative">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="space-y-6">
                            <h2 className="heading-2 text-fg">We don't just guess.</h2>
                            <p className="text-xl text-fg-secondary leading-relaxed">
                                Risk scores aren't magic. They are based on proven software engineering metrics that correlate strongly with bugs. Here is exactly what we look at:
                            </p>
                            <ul className="space-y-4 pt-4">
                                {[
                                    { label: 'Code Churn', desc: 'Ratio of lines added vs deleted and total files touched.' },
                                    { label: 'Complexity', desc: 'Cyclomatic complexity and the number of nested methods changed.' },
                                    { label: 'Developer History', desc: 'How frequently the commit author has introduced bugs in the past.' },
                                    { label: 'Timing Context', desc: 'Late-night or weekend commits are statistically riskier.' }
                                ].map((item, i) => (
                                    <li key={i} className="flex gap-4 p-4 rounded-2xl bg-fill1 border border-border/50">
                                        <div className="w-2 h-2 mt-2 rounded-full bg-primary flex-shrink-0"></div>
                                        <div>
                                            <span className="font-semibold text-fg block">{item.label}</span>
                                            <span className="text-fg-secondary text-sm">{item.desc}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-success/20 rounded-[2rem] blur-2xl group-hover:blur-3xl transition-all opacity-50"></div>
                            <div className="relative bg-fill1 border border-border p-8 rounded-[2rem] shadow-2xl flex flex-col gap-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-fg-secondary">Risk Score</span>
                                        <span className="text-error font-bold">89% (High)</span>
                                    </div>
                                    <div className="h-2 w-full bg-fill2 rounded-full overflow-hidden">
                                        <div className="h-full bg-error w-[89%] rounded-full"></div>
                                    </div>
                                </div>
                                <div className="space-y-4 pt-4 border-t border-border/50">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-fg">Files Changed</span>
                                        <span className="text-sm font-mono text-error">42</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-fg">Lines Added</span>
                                        <span className="text-sm font-mono text-error">+2,401</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-fg">Test Coverage</span>
                                        <span className="text-sm font-mono text-error">0%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full pointer-events-none opacity-50" />
                <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
                    <div className="order-2 lg:order-1 relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-info/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all opacity-50"></div>
                        <div className="relative bg-fill1 border border-border p-2 rounded-3xl overflow-hidden shadow-2xl">
                            <div className="bg-fill2 rounded-2xl aspect-video flex items-center justify-center border border-border/50 relative overflow-hidden group">
                                {/* Simulated UI representation */}
                                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-luminosity group-hover:opacity-60 transition-opacity duration-700"></div>
                                <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/50 to-transparent"></div>

                                <div className="relative z-10 flex flex-col items-center gap-4 text-center p-6">
                                    <div className="w-16 h-16 rounded-full bg-success/20 border border-success flex items-center justify-center animate-pulse">
                                        <CheckCircle2 className="w-8 h-8 text-success" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-heading font-semibold text-fg">Low Risk Commit</h4>
                                        <p className="text-sm text-fg-secondary">Safe to merge. No major risk factors detected.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="order-1 lg:order-2 space-y-8">
                        <h2 className="heading-2 text-fg">Built for your workflow.</h2>
                        <ul className="space-y-6">
                            {[
                                { title: '1. Connect a Repo', desc: 'Just paste a GitHub URL to get started. No complex setup.' },
                                { title: '2. Analyze Commits', desc: 'We scan your recent branch history for complexity, churn, and risk patterns.' },
                                { title: '3. Review Risks', desc: 'See which commits are High, Medium, or Low risk before you hit merge.' },
                            ].map((step, i) => (
                                <li key={i} className="flex gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold font-heading">
                                        {i + 1}
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-semibold text-fg mb-1">{step.title}</h4>
                                        <p className="text-fg-secondary">{step.desc}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-24 bg-fill1/30 border-t border-border/50 relative">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="heading-2 text-fg mb-4">Frequently Asked Questions</h2>
                        <p className="text-fg-secondary text-lg">Everything you need to know about how Predictor works.</p>
                    </div>

                    <Accordion type="single" collapsible className="space-y-4">
                        {[
                            {
                                id: "item-1",
                                q: "How does the bug prediction model work?",
                                a: "Our system uses an XGBoost machine learning model trained on over 16,000 real-world GitHub commits. It analyzes factors like code churn, cyclomatic complexity, and author history to calculate a precise risk probability."
                            },
                            {
                                id: "item-2",
                                q: "Do you store my source code?",
                                a: "No. We only process the metadata of your commits (lines added/deleted, file types, complexity metrics) through the GitHub API. Your actual source code is never stored on our servers."
                            },
                            {
                                id: "item-3",
                                q: "What languages are supported?",
                                a: "Currently, our model is highly optimized for Python and TypeScript/JavaScript repositories, as our training dataset was heavily focused on these ecosystems."
                            },
                            {
                                id: "item-4",
                                q: "Can I use this for private repositories?",
                                a: "Not right now. Currently, you can only analyze public repositories. Support for private repositories is on our roadmap!"
                            }
                        ].map((faq) => (
                            <AccordionItem key={faq.id} value={faq.id} className="border border-border/50 bg-fill2/50 rounded-2xl px-6 data-[state=open]:bg-fill2/80 transition-colors">
                                <AccordionTrigger className="text-lg font-medium py-6 hover:no-underline">
                                    {faq.q}
                                </AccordionTrigger>
                                <AccordionContent className="text-fg-secondary leading-relaxed pb-6 text-base">
                                    {faq.a}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-gradient-to-t from-fill1/80 to-bg border-t border-border/50 relative overflow-hidden">
                <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 w-[800px] h-[300px] bg-primary/20 blur-[120px] rounded-[100%] pointer-events-none opacity-50" />
                <div className="max-w-4xl mx-auto px-6 text-center space-y-8 relative z-10">
                    <h2 className="heading-2 text-fg">Stop merging broken code.</h2>
                    <p className="text-xl text-fg-secondary max-w-2xl mx-auto">
                        Join developers using Predictor to catch bugs before they reach production.
                    </p>
                    <div className="pt-6">
                        <Link to="/signup">
                            <Button className="rounded-full bg-primary hover:bg-primary-hover text-black h-14 px-10 text-lg shadow-[0_0_40px_-10px_var(--color-primary)] transition-all hover:scale-105 hover:shadow-[0_0_60px_-10px_var(--color-primary)]">
                                Try it free
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-border bg-fill1 py-5 mt-auto">
                <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <img src="./favicon.png" alt="bug prediction logo" className="size-20 " />
                    <p className="text-sm text-fg-tertiary">
                        © {new Date().getFullYear()} Bug Prediction System. All rights reserved.
                    </p>
                    <div className="flex gap-4">
                        <Link to="/signin" className="text-sm text-fg-secondary hover:text-fg transition-colors">Sign In</Link>
                        <Link to="/signup" className="text-sm text-fg-secondary hover:text-fg transition-colors">Sign Up</Link>
                    </div>
                </div>
            </footer>
        </div>
    )
}
